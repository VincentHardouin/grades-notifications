const chai = require('chai');
const expect = chai.expect;
const nock = require('nock');

const { getGrades } = require('../src/index');

describe('index', () => {

  describe('#getGrades', () => {
    it('should return all grades', async () => {
      // given
      const studentId = 'azerty123';
      const scope = nock('https://campusonline.inseec.net')
        .get('/note/note_ajax.php')
        .query({
          'numero_dossier': studentId,
          version: 'PROD',
          'mode_test': 'N',
        }).reply(200);

      // when
      const result = await getGrades(studentId);

      // then
      expect(result).to.be.not.empty;
      expect(scope.isDone()).to.be.true;
    });
  });
});
