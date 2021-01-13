const axios = require('axios');
const jsdom = require('jsdom');

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

module.exports = {
  getGrades,
  gradesHtmmlToJson,
};