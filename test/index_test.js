const sinon = require('sinon');
const chai = require('chai');
chai.use(require('sinon-chai'));
const expect = chai.expect;
const nock = require('nock');
const fs = require('fs');

const { getCoursesDifferences, getGrades, gradesHtmmlToJson, readGradesInFile, writeGradesInFile } = require('../src/index');

describe('index', () => {

  afterEach(() => {
    sinon.restore();
  });

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

  describe('#gradesHtmmlToJson', () => {
    it('should return grades into JSON format', async () => {
      // given
      const grades = '<table>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-ens" style="padding-left: 15px;"></td>\n' +
          '\t<td class="ponderation item-ens"></td>\n' +
          '\t<td class="coefficient item-ens"></td>\n' +
          '\t<td class="note item-ens"></td>\n' +
          '\t<td class="rattrapage item-ens"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-fpc" style="padding-left: 30px;">Crédits par indulgence / Leniency credits </td>\n' +
          '\t<td class="ponderation item-fpc">1</td>\n' +
          '\t<td class="coefficient item-fpc"></td>\n' +
          '\t<td class="note item-fpc"></td>\n' +
          '\t<td class="rattrapage item-fpc"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-ev1" style="padding-left: 30px;">Contrôle Continu</td>\n' +
          '\t<td class="ponderation item-ev1"></td>\n' +
          '\t<td class="coefficient item-ev1">100%</td>\n' +
          '\t<td class="note item-ev1"></td>\n' +
          '\t<td class="rattrapage item-ev1"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-ens" style="padding-left: 15px;">Semestre 7 >> Apprentissage >> Tronc commun\n' +
          '\t\tobligatoire >> Majeure Systèmes d\'Information</td>\n' +
          '\t<td class="ponderation item-ens"></td>\n' +
          '\t<td class="coefficient item-ens"></td>\n' +
          '\t<td class="note item-ens"></td>\n' +
          '\t<td class="rattrapage item-ens"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-ens" style="padding-left: 60px;">Module Acquis Entreprise</td>\n' +
          '\t<td class="ponderation item-ens"></td>\n' +
          '\t<td class="coefficient item-ens"></td>\n' +
          '\t<td class="note item-ens"></td>\n' +
          '\t<td class="rattrapage item-ens"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-fpc" style="padding-left: 75px;">Acquis Entreprise / Company Learnings</td>\n' +
          '\t<td class="ponderation item-fpc">1</td>\n' +
          '\t<td class="coefficient item-fpc"></td>\n' +
          '\t<td class="note item-fpc"></td>\n' +
          '\t<td class="rattrapage item-fpc"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-ev1" style="padding-left: 75px;">Contrôle Continu</td>\n' +
          '\t<td class="ponderation item-ev1"></td>\n' +
          '\t<td class="coefficient item-ev1">100%</td>\n' +
          '\t<td class="note item-ev1"></td>\n' +
          '\t<td class="rattrapage item-ev1"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-ens" style="padding-left: 60px;">Module Expérience Entreprise</td>\n' +
          '\t<td class="ponderation item-ens"></td>\n' +
          '\t<td class="coefficient item-ens"></td>\n' +
          '\t<td class="note item-ens"></td>\n' +
          '\t<td class="rattrapage item-ens"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-fpc" style="padding-left: 75px;">Expérience Entreprise / Experience Feedback</td>\n' +
          '\t<td class="ponderation item-fpc">1</td>\n' +
          '\t<td class="coefficient item-fpc"></td>\n' +
          '\t<td class="note item-fpc"></td>\n' +
          '\t<td class="rattrapage item-fpc"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-ev1" style="padding-left: 75px;">Contrôle Continu</td>\n' +
          '\t<td class="ponderation item-ev1"></td>\n' +
          '\t<td class="coefficient item-ev1">100%</td>\n' +
          '\t<td class="note item-ev1"></td>\n' +
          '\t<td class="rattrapage item-ev1"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-ens" style="padding-left: 60px;">Module Langues et Formation Humaine</td>\n' +
          '\t<td class="ponderation item-ens"></td>\n' +
          '\t<td class="coefficient item-ens"></td>\n' +
          '\t<td class="note item-ens"></td>\n' +
          '\t<td class="rattrapage item-ens"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-fpc" style="padding-left: 75px;">Anglais / English</td>\n' +
          '\t<td class="ponderation item-fpc">2</td>\n' +
          '\t<td class="coefficient item-fpc"></td>\n' +
          '\t<td class="note item-fpc"></td>\n' +
          '\t<td class="rattrapage item-fpc"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-ev1" style="padding-left: 75px;">Contrôle Continu</td>\n' +
          '\t<td class="ponderation item-ev1"></td>\n' +
          '\t<td class="coefficient item-ev1">75%</td>\n' +
          '\t<td class="note item-ev1">12,00 </td>\n' +
          '\t<td class="rattrapage item-ev1"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-ev1" style="padding-left: 75px;">Examen</td>\n' +
          '\t<td class="ponderation item-ev1"></td>\n' +
          '\t<td class="coefficient item-ev1">25%</td>\n' +
          '\t<td class="note item-ev1">12,00 </td>\n' +
          '\t<td class="rattrapage item-ev1"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-fpc" style="padding-left: 75px;">Management d\'équipe / Team Management</td>\n' +
          '\t<td class="ponderation item-fpc">1</td>\n' +
          '\t<td class="coefficient item-fpc"></td>\n' +
          '\t<td class="note item-fpc"></td>\n' +
          '\t<td class="rattrapage item-fpc"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-ev1" style="padding-left: 75px;">Examen</td>\n' +
          '\t<td class="ponderation item-ev1"></td>\n' +
          '\t<td class="coefficient item-ev1">100%</td>\n' +
          '\t<td class="note item-ev1">11,00 </td>\n' +
          '\t<td class="rattrapage item-ev1"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-fpc" style="padding-left: 75px;">La Dialogue Social / Social Dialogue</td>\n' +
          '\t<td class="ponderation item-fpc">1</td>\n' +
          '\t<td class="coefficient item-fpc"></td>\n' +
          '\t<td class="note item-fpc"></td>\n' +
          '\t<td class="rattrapage item-fpc"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-ev1" style="padding-left: 75px;">Examen</td>\n' +
          '\t<td class="ponderation item-ev1"></td>\n' +
          '\t<td class="coefficient item-ev1">100%</td>\n' +
          '\t<td class="note item-ev1">10,00 </td>\n' +
          '\t<td class="rattrapage item-ev1"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-ens" style="padding-left: 60px;">Module Gestion de Projet</td>\n' +
          '\t<td class="ponderation item-ens"></td>\n' +
          '\t<td class="coefficient item-ens"></td>\n' +
          '\t<td class="note item-ens"></td>\n' +
          '\t<td class="rattrapage item-ens"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-fpc" style="padding-left: 75px;">Gestion de projet (MOOC) / Project Management\n' +
          '\t\t(MOOC)</td>\n' +
          '\t<td class="ponderation item-fpc">1</td>\n' +
          '\t<td class="coefficient item-fpc"></td>\n' +
          '\t<td class="note item-fpc"></td>\n' +
          '\t<td class="rattrapage item-fpc"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-ev1" style="padding-left: 75px;">Examen</td>\n' +
          '\t<td class="ponderation item-ev1"></td>\n' +
          '\t<td class="coefficient item-ev1">50%</td>\n' +
          '\t<td class="note item-ev1"></td>\n' +
          '\t<td class="rattrapage item-ev1"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-ev1" style="padding-left: 75px;">Contrôle Continu</td>\n' +
          '\t<td class="ponderation item-ev1"></td>\n' +
          '\t<td class="coefficient item-ev1">50%</td>\n' +
          '\t<td class="note item-ev1"></td>\n' +
          '\t<td class="rattrapage item-ev1"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-ens" style="padding-left: 60px;">Module Majeure Systèmes d\'Information</td>\n' +
          '\t<td class="ponderation item-ens"></td>\n' +
          '\t<td class="coefficient item-ens"></td>\n' +
          '\t<td class="note item-ens"></td>\n' +
          '\t<td class="rattrapage item-ens"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-fpc" style="padding-left: 75px;">Réseaux Informatiques / Computer Networks</td>\n' +
          '\t<td class="ponderation item-fpc">4</td>\n' +
          '\t<td class="coefficient item-fpc"></td>\n' +
          '\t<td class="note item-fpc"></td>\n' +
          '\t<td class="rattrapage item-fpc"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-ev1" style="padding-left: 75px;">Contrôle Continu</td>\n' +
          '\t<td class="ponderation item-ev1"></td>\n' +
          '\t<td class="coefficient item-ev1">50%</td>\n' +
          '\t<td class="note item-ev1">14,00 </td>\n' +
          '\t<td class="rattrapage item-ev1"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-ev1" style="padding-left: 75px;">Examen</td>\n' +
          '\t<td class="ponderation item-ev1"></td>\n' +
          '\t<td class="coefficient item-ev1">50%</td>\n' +
          '\t<td class="note item-ev1">8,00 </td>\n' +
          '\t<td class="rattrapage item-ev1"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-fpc" style="padding-left: 75px;">Programmation mobile / Mobile Programming</td>\n' +
          '\t<td class="ponderation item-fpc">4</td>\n' +
          '\t<td class="coefficient item-fpc"></td>\n' +
          '\t<td class="note item-fpc"></td>\n' +
          '\t<td class="rattrapage item-fpc"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-ev1" style="padding-left: 75px;">Contrôle Continu</td>\n' +
          '\t<td class="ponderation item-ev1"></td>\n' +
          '\t<td class="coefficient item-ev1">60%</td>\n' +
          '\t<td class="note item-ev1">16,70 </td>\n' +
          '\t<td class="rattrapage item-ev1"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-ev1" style="padding-left: 75px;">Examen</td>\n' +
          '\t<td class="ponderation item-ev1"></td>\n' +
          '\t<td class="coefficient item-ev1">40%</td>\n' +
          '\t<td class="note item-ev1"></td>\n' +
          '\t<td class="rattrapage item-ev1"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-fpc" style="padding-left: 75px;">Bases de Données avancées / Advanced Databases</td>\n' +
          '\t<td class="ponderation item-fpc">4</td>\n' +
          '\t<td class="coefficient item-fpc"></td>\n' +
          '\t<td class="note item-fpc"></td>\n' +
          '\t<td class="rattrapage item-fpc"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-ev1" style="padding-left: 75px;">Contrôle Continu</td>\n' +
          '\t<td class="ponderation item-ev1"></td>\n' +
          '\t<td class="coefficient item-ev1">60%</td>\n' +
          '\t<td class="note item-ev1"></td>\n' +
          '\t<td class="rattrapage item-ev1"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-ev1" style="padding-left: 75px;">Examen</td>\n' +
          '\t<td class="ponderation item-ev1"></td>\n' +
          '\t<td class="coefficient item-ev1">40%</td>\n' +
          '\t<td class="note item-ev1"></td>\n' +
          '\t<td class="rattrapage item-ev1"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-fpc" style="padding-left: 75px;">DevOps with SRE / DevOps with SRE</td>\n' +
          '\t<td class="ponderation item-fpc">4</td>\n' +
          '\t<td class="coefficient item-fpc"></td>\n' +
          '\t<td class="note item-fpc"></td>\n' +
          '\t<td class="rattrapage item-fpc"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-ev1" style="padding-left: 75px;">Contrôle Continu</td>\n' +
          '\t<td class="ponderation item-ev1"></td>\n' +
          '\t<td class="coefficient item-ev1">50%</td>\n' +
          '\t<td class="note item-ev1"></td>\n' +
          '\t<td class="rattrapage item-ev1"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-ev1" style="padding-left: 75px;">Examen</td>\n' +
          '\t<td class="ponderation item-ev1"></td>\n' +
          '\t<td class="coefficient item-ev1">50%</td>\n' +
          '\t<td class="note item-ev1"></td>\n' +
          '\t<td class="rattrapage item-ev1"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-fpc" style="padding-left: 75px;">Bonus (s\'ajoute à la moyenne) / Bonus points (added\n' +
          '\t\tto the student’s average)</td>\n' +
          '\t<td class="ponderation item-fpc">1,6</td>\n' +
          '\t<td class="coefficient item-fpc"></td>\n' +
          '\t<td class="note item-fpc"></td>\n' +
          '\t<td class="rattrapage item-fpc"></td>\n' +
          '</tr>\n' +
          '<tr class="slave master-1">\n' +
          '\t<td class="libelle item-ev1" style="padding-left: 75px;">Contrôle Continu</td>\n' +
          '\t<td class="ponderation item-ev1"></td>\n' +
          '\t<td class="coefficient item-ev1">100%</td>\n' +
          '\t<td class="note item-ev1"></td>\n' +
          '\t<td class="rattrapage item-ev1"></td>\n' +
          '</tr>\n' +
          '</table>';

      const expectedResult = [
        {
          'matieres': [
            {
              'evaluations': [
                {
                  'note': '',
                  'noteRattrapage': '',
                  'title': 'Contrôle Continu',
                },
              ],
              'title': 'Crédits par indulgence / Leniency credits ',
            },
          ],
          'module': '',
        },
        {
          'matieres': [],
          'module': 'Semestre 7 >> Apprentissage >> Tronc commun\n\t\tobligatoire >> Majeure Systèmes d\'Information',
        },
        {
          'matieres': [
            {
              'evaluations': [
                {
                  'note': '',
                  'noteRattrapage': '',
                  'title': 'Contrôle Continu',
                },
              ],
              'title': 'Acquis Entreprise / Company Learnings',
            },
          ],
          'module': 'Module Acquis Entreprise',
        },
        {
          'matieres': [
            {
              'evaluations': [
                {
                  'note': '',
                  'noteRattrapage': '',
                  'title': 'Contrôle Continu',
                },
              ],
              'title': 'Expérience Entreprise / Experience Feedback',
            },
          ],
          'module': 'Module Expérience Entreprise',
        },
        {
          'matieres': [
            {
              'evaluations': [
                {
                  'note': '12,00 ',
                  'noteRattrapage': '',
                  'title': 'Contrôle Continu',
                },
                {
                  'note': '12,00 ',
                  'noteRattrapage': '',
                  'title': 'Examen',
                },
              ],
              'title': 'Anglais / English',
            },
            {
              'evaluations': [
                {
                  'note': '11,00 ',
                  'noteRattrapage': '',
                  'title': 'Examen',
                },
              ],
              'title': 'Management d\'équipe / Team Management',
            },
            {
              'evaluations': [
                {
                  'note': '10,00 ',
                  'noteRattrapage': '',
                  'title': 'Examen',
                },
              ],
              'title': 'La Dialogue Social / Social Dialogue',
            },
          ],
          'module': 'Module Langues et Formation Humaine',
        },
        {
          'matieres': [
            {
              'evaluations': [
                {
                  'note': '',
                  'noteRattrapage': '',
                  'title': 'Examen',
                },
                {
                  'note': '',
                  'noteRattrapage': '',
                  'title': 'Contrôle Continu',
                },
              ],
              'title': 'Gestion de projet (MOOC) / Project Management\n\t\t(MOOC)',
            },
          ],
          'module': 'Module Gestion de Projet',
        },
        {
          'matieres': [
            {
              'evaluations': [
                {
                  'note': '14,00 ',
                  'noteRattrapage': '',
                  'title': 'Contrôle Continu',
                },
                {
                  'note': '8,00 ',
                  'noteRattrapage': '',
                  'title': 'Examen',
                },
              ],
              'title': 'Réseaux Informatiques / Computer Networks',
            },
            {
              'evaluations': [
                {
                  'note': '16,70 ',
                  'noteRattrapage': '',
                  'title': 'Contrôle Continu',
                },
                {
                  'note': '',
                  'noteRattrapage': '',
                  'title': 'Examen',
                },
              ],
              'title': 'Programmation mobile / Mobile Programming',
            },
            {
              'evaluations': [
                {
                  'note': '',
                  'noteRattrapage': '',
                  'title': 'Contrôle Continu',
                },
                {
                  'note': '',
                  'noteRattrapage': '',
                  'title': 'Examen',
                },
              ],
              'title': 'Bases de Données avancées / Advanced Databases',
            },
            {
              'evaluations': [
                {
                  'note': '',
                  'noteRattrapage': '',
                  'title': 'Contrôle Continu',
                },
                {
                  'note': '',
                  'noteRattrapage': '',
                  'title': 'Examen',
                },
              ],
              'title': 'DevOps with SRE / DevOps with SRE',
            },
            {
              'evaluations': [
                {
                  'note': '',
                  'noteRattrapage': '',
                  'title': 'Contrôle Continu',
                },
              ],
              'title': 'Bonus (s\'ajoute à la moyenne) / Bonus points (added\n\t\tto the student’s average)',
            },
          ],
          'module': 'Module Majeure Systèmes d\'Information',
        },
      ];

      // when
      const result = gradesHtmmlToJson(grades);

      // then
      expect(result).to.deep.equal(expectedResult);
    });
  });

  describe('#writeGradesInFile', () => {
    it('should save grades into file', async () => {
      // given
      const grades = { note: 12 };
      const stringifiedGrades = JSON.stringify(grades);
      const filename = 'filename.json';
      const fsStub = sinon.stub(fs, 'writeFileSync').returns();

      // when
      writeGradesInFile(grades, filename);

      // then
      expect(fsStub).to.have.been.calledWithExactly(filename, stringifiedGrades);
    });
  });

  describe('#readGradesInFile', () => {
    it('should return grades from file', async () => {
      // given
      const grades = { note: 12 };
      const stringifiedGrades = JSON.stringify(grades);
      const filename = 'filename.json';
      const fsStub = sinon.stub(fs, 'readFileSync').returns(stringifiedGrades);

      // when
      const result = readGradesInFile(filename);

      // then
      expect(fsStub).to.have.been.calledWithExactly(filename, 'utf-8');
      expect(result).to.deep.equal(grades);
    });

    it('should return null when file is empty', async () => {
      // given
      const filename = 'filename.json';
      const fsStub = sinon.stub(fs, 'readFileSync').returns('');

      // when
      const result = readGradesInFile(filename);

      // then
      expect(fsStub).to.have.been.calledWithExactly(filename, 'utf-8');
      expect(result).to.equal(null);
    });
  });

  describe('#getCoursesDifferences', () => {
    it('should return only difference from old values', () => {
      // given
      const oldValues = [
        {
          module: 'toto',
          matieres: [
            { title: 'tjnd', evaluations: [{ title: 'Examen', note: 12 }, { title: 'CC', note: 12 }] },
            { title: 'tjnddfc', evaluations: [{ title: 'Examen', note: 10 }, { title: 'CC', note: 10 }] },
          ],
        }, {
          module: 'langues',
          matieres: [
            { title: 'fr', evaluations: [{ title: 'Examen', note: 12 }, { title: 'CC', note: 12 }] },
            { title: 'en', evaluations: [{ title: 'Examen', note: 10 }, { title: 'CC', note: '' }] },
          ],
        },
        {
          module: 'sport',
          matieres: [
            { title: 'bad', evaluations: [{ title: 'Examen', note: 7 }, { title: 'CC', note: 12 }] },
            { title: 'volley', evaluations: [{ title: 'Examen', note: 10 }, { title: 'CC', note: '' }] },
          ],
        }];

      const newValues = [
        {
          module: 'toto',
          matieres: [
            { title: 'tjnd', evaluations: [{ title: 'Examen', note: 12 }, { title: 'CC', note: 12 }] },
            { title: 'tjnddfc', evaluations: [{ title: 'Examen', note: 10 }, { title: 'CC', note: 10 }] },
          ],
        }, {
          module: 'langues',
          matieres: [
            { title: 'fr', evaluations: [{ title: 'Examen', note: 12 }, { title: 'CC', note: 12 }] },
            { title: 'en', evaluations: [{ title: 'Examen', note: 10 }, { title: 'CC', note: 19 }] },
          ],
        },{
          module: 'sport',
          matieres: [
            { title: 'bad', evaluations: [{ title: 'Examen', note: 7 }, { title: 'CC', note: 12 }] },
            { title: 'volley', evaluations: [{ title: 'Examen', note: 10 }, { title: 'CC', note: 15 }] },
          ],
        }];

      const expectedDifferences = [
        {
          matieres: [
            {
              evaluations: [
                {
                  note: 19,
                  title: 'CC',
                },
              ],
              title: 'en',
            },
          ],
          module: 'langues',
        },
        {
          matieres: [
            {
              evaluations: [
                {
                  note: 15,
                  title: 'CC',
                },
              ],
              title: 'volley',
            },
          ],
          module: 'sport',
        },
      ];

      // when
      const result = getCoursesDifferences(oldValues, newValues);

      // then
      expect(result).to.deep.equal(expectedDifferences);
    });
  });
});
