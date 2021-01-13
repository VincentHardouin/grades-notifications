const axios = require('axios');

function getGrades(studentId) {
  return axios.get('https://campusonline.inseec.net/note/note_ajax.php', {
    params: {
      'numero_dossier': studentId,
      version: 'PROD',
      'mode_test': 'N',
    },
  });
}

module.exports = {
  getGrades,
};
