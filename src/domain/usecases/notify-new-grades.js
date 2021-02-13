require('dotenv').config();
const config = require('../../config');
const storageClient = require('../../infrastructure/StorageClient');
const _ = require('lodash');
const axios = require('axios');
const jsdom = require('jsdom');
const fs = require('fs');

function _getOldGradesFromLocal(filename) {
  const stringifiedGrades = fs.readFileSync(filename, 'utf-8');
  if (!stringifiedGrades) {
    return null;
  }
  return  JSON.parse(stringifiedGrades);
}

async function _getOldGradesFromRemote(studentId) {
  const fileName = `${studentId}/grades.json`;
  const result = await storageClient.getObject(fileName);
  return JSON.parse(result.Body.toString('utf-8'));
}

async function _getOldGrades(studentId) {
  let oldGrades;
  if (config.featureToggles.withRemoteStorage) {
    oldGrades = await _getOldGradesFromRemote(studentId);
  } else {
    oldGrades = _getOldGradesFromLocal(`${studentId}.json`);
  }
  return oldGrades;
}

async function _getGrades(studentId) {
  const schoolUrlForGrades = config.schoolUrlForGrades;
  if (!schoolUrlForGrades) {
    throw new Error('SchoolUrlForGrades are not defined');
  }

  const { data } = await axios.get(schoolUrlForGrades, {
    params: {
      'numero_dossier': studentId,
      version: 'PROD',
      'mode_test': 'N',
    },
  });
  return data;
}

function _gradesHtmlToJson(str) {
  const dom = new jsdom.JSDOM(str);
  const elHtml = dom.window.document.getElementsByClassName('master-1');
  const elements = Array.from(elHtml);

  const els = elements.reduce(function(acc, curr) {
    const child = curr.children[0];
    const className = child.className;

    if (className.match(/ens/)) {
      const text = child.textContent;
      acc.push({ module: text, matieres: [] });
    }
    if (className.match(/fpc/)) {
      const text = child.textContent;
      acc[acc.length - 1].matieres.push({ title: text, evaluations: [] });
    }
    if (className.match(/ev/)) {
      const text = child.textContent;
      const note = curr.children[3].textContent;
      const noteRattrapage = curr.children[4].textContent;
      const index = acc.length - 1;
      const matiereIndex = acc[index].matieres.length - 1;

      acc[index].matieres[matiereIndex].evaluations.push({  title: text, note, noteRattrapage });
    }

    return acc;
  }, []);

  return els;
}

function _writeGradesInFile(grades, filename) {
  const stringifiedGrades = JSON.stringify(grades);
  return fs.writeFileSync(filename, stringifiedGrades);
}

async function _saveGradesInRemote(grades, studentId) {
  return storageClient.putObject({ fileName: `${studentId}/grades.json`, fileContent: JSON.stringify(grades) });
}

async function _saveGrades(grades, studentId) {
  if (config.featureToggles.withRemoteStorage) {
    return _saveGradesInRemote(grades, studentId);
  } else {
    return _writeGradesInFile(grades, `${studentId}.json`);
  }
}

function _getOldModule(newModule, oldModules) {
  return _.find(oldModules, ['module', newModule.module]);
}

function _getOldMatiere(newMatiere, oldMatiere) {
  return _.find(oldMatiere, ['title', newMatiere.title]);
}

function _findOnlyEditedEvaluations(oldModule) {
  return function(matiere) {
    const oldMatiere = _getOldMatiere(matiere, oldModule.matieres);
    const summarizedEvaluations = _.differenceWith(oldMatiere.evaluations, matiere.evaluations, _.isEqual);

    matiere.evaluations = summarizedEvaluations;
    return matiere;
  };
}

function _getOldModulesByDifferencesAndOldValues(differences, oldValues) {
  return _.filter(oldValues, function(module) {
    return _.some(differences, ['module', module.module]);
  });
}

function _getCoursesDifferences(oldValues, newValues) {
  const differences = _.differenceWith(newValues, oldValues, _.isEqual);
  const oldModules = _getOldModulesByDifferencesAndOldValues(differences, oldValues);

  return _.map(differences, function(module) {
    const oldModule = _getOldModule(module, oldModules);

    module.matieres = _(module.matieres)
      .differenceWith(oldModule.matieres, _.isEqual)
      .map(_findOnlyEditedEvaluations(oldModule)).value();

    return module;
  });
}

function _createTemplateForSlack(differences) {
  const template = differences.flatMap((module) => {
    return module.matieres.flatMap((matiere) => {
      return {
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text': `*Nouvelles Notes !!* :memo: \nMatière : ${matiere.title}`,
        },
        'fields': matiere.evaluations.map((evaluation) => {
          return {
            'type': 'mrkdwn',
            'text': `*${evaluation.title}*\n ${evaluation.note}`,
          };
        }),
      };
    });
  });

  return template;
}

function _sendGrades(data) {
  const webhookUrl = config.slack.webhookUrl;
  return axios.post(webhookUrl, data, { headers: { 'content-type': 'application/json' } });
}

module.exports = async function notifyNewGrades() {
  const studentId = config.studentId;
  if (!studentId) {
    throw new Error('studentId are not defined');
  }
  
  const oldGrades = await _getOldGrades(studentId);
  if (!oldGrades) {
    throw new Error('oldGrades are not defined');
  }
  
  let newGrades = await _getGrades(studentId);
  if (!newGrades) {
    throw new Error('newGrades are not available');
  }

  newGrades = _gradesHtmlToJson(newGrades);
  if (_.isEmpty(newGrades)) {
    throw new Error('newGrades are not available');
  }

  const getDifferences = _getCoursesDifferences(newGrades, oldGrades);

  if (_.isEmpty(getDifferences)) {
    return 'No new grades';
  }

  const template = _createTemplateForSlack(getDifferences);

  await _saveGrades(newGrades, studentId);
  await _sendGrades({ blocks: template });

  return 'New grades notifications are send';
};
