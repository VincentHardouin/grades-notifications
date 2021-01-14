const axios = require('axios');
const jsdom = require('jsdom');
const fs = require('fs');
const _ = require('lodash');

const config = require('./config');

function getGrades(studentId) {
  return axios.get('https://campusonline.inseec.net/note/note_ajax.php', {
    params: {
      'numero_dossier': studentId,
      version: 'PROD',
      'mode_test': 'N',
    },
  });
}

function gradesHtmmlToJson(str) {
  const dom = new jsdom.JSDOM(str);
  const elHtml =   dom.window.document.getElementsByClassName('master-1');
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

function writeGradesInFile(grades, filename) {
  const stringifiedGrades = JSON.stringify(grades);
  return fs.writeFileSync(filename, stringifiedGrades);
}

function readGradesInFile(filename) {
  const stringifiedGrades = fs.readFileSync(filename, 'utf-8');
  if (!stringifiedGrades) {
    return null;
  }
  return  JSON.parse(stringifiedGrades);
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
    const summarizedEvaluations = _.differenceWith(matiere.evaluations, oldMatiere.evaluations, _.isEqual);

    matiere.evaluations = summarizedEvaluations;
    return matiere;
  };
}

function _getOldModulesByDifferencesAndOldValues(differences, oldValues) {
  return _.filter(oldValues, function(module) {
    return _.some(differences, ['module', module.module]);
  });
}

function getCoursesDifferences(oldValues, newValues) {
  const differences = _(newValues).differenceWith(oldValues, _.isEqual).value();
  const oldModules = _getOldModulesByDifferencesAndOldValues(differences, oldValues);

  return _.map(differences, function(module) {

    const oldModule = _getOldModule(module, oldModules);
    let summarizedMatieres = _.differenceWith(module.matieres, oldModule.matieres, _.isEqual);

    summarizedMatieres = _.map(summarizedMatieres, _findOnlyEditedEvaluations(oldModule));

    module.matieres = summarizedMatieres;
    return module;
  });
}

function createTemplateForSlack(differences) {
  return differences.map(function(module) {
    return module.matieres.map(function(matiere) {
      return {
        'fallback': 'Nouvelles Notes !! :memo: ',
        'text': `Matière : ${matiere.title}`,
        'title': 'Nouvelles Notes !! :memo: ',
        'fields': matiere.evaluations.map(function(eval) {
          return {
            'title': eval.title,
            'value': eval.note,
            'short': true,
          };
        }),
      };
    });
  });

}

function sendGrades(data) {
  const webhookUrl = config.slack.webhookUrl;
  return  axios.post(webhookUrl, data, { headers: { 'content-type': 'application/json' } });
}

module.exports = {
  createTemplateForSlack,
  getCoursesDifferences,
  getGrades,
  gradesHtmmlToJson,
  readGradesInFile,
  writeGradesInFile,
  sendGrades,
};
