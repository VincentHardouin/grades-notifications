const sinon = require('sinon');
const chai = require('chai');
chai.use(require('sinon-chai'));
const expect = chai.expect;
const nock = require('nock');
const fs = require('fs');
const axios = require('axios');

const config = require('../src/config');
const storageClient = require('../src/infrastructure/StorageClient');
const notifyNewGrades = require('../src/domain/usecases/notify-new-grades');

function catchErr(promiseFn, ctx) {
  return async (...args) => {
    try {
      await promiseFn.call(ctx, ...args);
      return 'should have thrown an error';
    } catch (err) {
      return err;
    }
  };
}

describe('Unit | Use Case | notify-new-grades', () => {

  const htmlGrades =  '<table><tr class="slave master-1">\n' +
      '\t<td class="libelle item-ens" style="padding-left: 60px;">Module de test</td>\n' +
      '\t<td class="ponderation item-ens"></td>\n' +
      '\t<td class="coefficient item-ens"></td>\n' +
      '\t<td class="note item-ens"></td>\n' +
      '\t<td class="rattrapage item-ens"></td>\n' +
      '</tr>\n' +
      '<tr class="slave master-1">\n' +
      '\t<td class="libelle item-fpc" style="padding-left: 75px;">Test</td>\n' +
      '\t<td class="ponderation item-fpc">1</td>\n' +
      '\t<td class="coefficient item-fpc"></td>\n' +
      '\t<td class="note item-fpc"></td>\n' +
      '\t<td class="rattrapage item-fpc"></td>\n' +
      '</tr>\n' +
      '<tr class="slave master-1">\n' +
      '\t<td class="libelle item-ev1" style="padding-left: 75px;">CC</td>\n' +
      '\t<td class="ponderation item-ev1"></td>\n' +
      '\t<td class="coefficient item-ev1">100%</td>\n' +
      '\t<td class="note item-ev1">13</td>\n' +
      '\t<td class="rattrapage item-ev1"></td>\n' +
      '</tr></table>';

  afterEach(async () => {
    await sinon.restore();
  });

  it('should call school api to get grades', async () => {
    // given
    const studentId = config.studentId;
    const schoolUrlForGrades = config.schoolUrlForGrades;
    const scope = nock(schoolUrlForGrades)
      .get('/')
      .query({
        'numero_dossier': studentId,
        version: 'PROD',
        'mode_test': 'N',
      }).reply(200, {});
    sinon.stub(fs, 'readFileSync').returns(JSON.stringify({ test: 'test' }));
    sinon.stub(axios, 'post').resolves();

    // when
    await notifyNewGrades();

    // then
    expect(scope.isDone()).to.be.true;
  });

  context('when feature toggle with remote storage is disabled', () => {
    it('should get old grades with local file', async () => {
      // given
      sinon.stub(axios, 'get').resolves({ data: htmlGrades });
      const fsStub = sinon.stub(fs, 'readFileSync');
      fsStub.returns(JSON.stringify([{
        module: 'Module de test',
        matieres: [{ title: 'Test', evaluations: [{ title: 'CC', note: '13', noteRattrapage:'' }] }],
      }]));

      const writeFileStub = sinon.stub(fs, 'writeFileSync');
      sinon.stub(axios, 'post');

      // when
      await notifyNewGrades();

      // then
      expect(writeFileStub).to.have.not.been.called;
      expect(fsStub).to.have.been.called;
    });
  });

  context('when feature toggle with remote storage is enable', () => {
    beforeEach(() => {
      config.featureToggles.withRemoteStorage = true;
    });

    afterEach(() => {
      config.featureToggles.withRemoteStorage = false;
    });

    it('should get old grades with remote file', async () => {
      // given
      sinon.stub(axios, 'get').resolves({ data: htmlGrades });
      sinon.stub(fs, 'readFileSync').throws(new Error('Use fs.readFileSync instead of storageClient.getObject'));
      const storageClientStub = sinon.stub(storageClient, 'getObject');
      storageClientStub.resolves({ Body: new Buffer.from(JSON.stringify([{
        module: 'Module de test',
        matieres: [{ title: 'Test', evaluations: [{ title: 'CC', note: '13', noteRattrapage:'' }] }],
      }])) });

      const writeFileStub = sinon.stub(fs, 'writeFileSync');
      sinon.stub(axios, 'post');

      // when
      await notifyNewGrades();

      // then
      expect(writeFileStub).to.have.not.been.called;
      expect(storageClientStub).to.have.been.called;
    });
  });
  
  context('when there are not differences between olGrades and newGrades', () => {
    it('should not call slack API', async () => {
      // given
      sinon.stub(axios, 'get').resolves({ data: htmlGrades });
      sinon.stub(fs, 'readFileSync').returns(JSON.stringify([{
        module: 'Module de test',
        matieres: [{ title: 'Test', evaluations: [{ title: 'CC', note: '13', noteRattrapage:'' }] }],
      }]));
      sinon.stub(fs, 'writeFileSync');

      const postSlackStub = sinon.stub(axios, 'post');

      // when
      await notifyNewGrades();

      // then
      expect(postSlackStub).to.have.not.been.called;
    });

    context('when feature toggle with remote storage is disabled', () => {
      it('should not save grades in file', async () => {
        // given
        sinon.stub(axios, 'get').resolves({ data: htmlGrades });
        sinon.stub(fs, 'readFileSync').returns(JSON.stringify([{
          module: 'Module de test',
          matieres: [{ title: 'Test', evaluations: [{ title: 'CC', note: '13', noteRattrapage:'' }] }],
        }]));
        const writeFileStub = sinon.stub(fs, 'writeFileSync');
        sinon.stub(axios, 'post');

        // when
        await notifyNewGrades();

        // then
        expect(writeFileStub).to.have.not.been.called;
      });
    });

    context('when feature toggle with remote storage is enable', () => {
      beforeEach(() => {
        config.featureToggles.withRemoteStorage = true;
      });

      afterEach(() => {
        config.featureToggles.withRemoteStorage = false;
      });

      it('should not save grades in remote', async () => {
        // given
        sinon.stub(axios, 'get').resolves({ data: htmlGrades });

        const storageClientGetStub = sinon.stub(storageClient, 'getObject');
        storageClientGetStub.resolves({ Body: new Buffer.from(JSON.stringify([{
          module: 'Module de test',
          matieres: [{ title: 'Test', evaluations: [{ title: 'CC', note: '13', noteRattrapage:'' }] }],
        }])) });

        const storageClientPutStub = sinon.stub(storageClient, 'putObject');
        storageClientPutStub.resolves();

        // when
        await notifyNewGrades();

        // then
        expect(storageClientPutStub).to.have.not.been.called;
      });
    });
  });

  context('when there are differences between oldGrades and newGrades', () => {
    it('should post message on Slack', async () => {
      // given
      const slackWebhookUrl = config.slack.webhookUrl;

      sinon.stub(axios, 'get').resolves({ data: htmlGrades });
      sinon.stub(fs, 'readFileSync').returns(JSON.stringify([{
        module: 'Module de test',
        matieres: [{ title: 'Test', evaluations: [{ title: 'CC', note: 12 }] }],
      }]));
      sinon.stub(fs, 'writeFileSync');

      const expectedTemplate = [{ type:'section', text:{ type:'mrkdwn',text:'*Nouvelles Notes !!* :memo: \nMatière : Test' }, fields:[{ type:'mrkdwn',text:'*CC*\n 12' }] }];
      const postSlackStub = sinon.stub(axios, 'post').resolves();

      // when
      await notifyNewGrades();

      // then
      expect(postSlackStub).to.be.calledWithExactly(slackWebhookUrl, { blocks: expectedTemplate }, { headers: { 'content-type': 'application/json' } });
    });

    context('when feature toggle with remote storage is disable', () => {
      beforeEach(() => {
        config.featureToggles.withRemoteStorage = false;
      });

      it('should save grades in file', async () => {
        // given
        const newGrades = [{
          module: 'Module de test',
          matieres: [{ title: 'Test', evaluations: [{ title: 'CC', note: '13', noteRattrapage: '' }] }],
        }];

        sinon.stub(axios, 'get').resolves({ data: htmlGrades });
        sinon.stub(fs, 'readFileSync').returns(JSON.stringify([{
          module: 'Module de test',
          matieres: [{ title: 'Test', evaluations: [{ title: 'CC', note: 12 }] }],
        }]));
        sinon.stub(axios, 'post').resolves();
        const writeFileStub = sinon.stub(fs, 'writeFileSync');
        writeFileStub.resolves({});

        // when
        await notifyNewGrades();

        // then
        expect(writeFileStub).to.have.been.calledWithExactly(`${config.studentId}.json`, JSON.stringify(newGrades));
      });
    });

    context('when feature toggle with remote storage is enable', () => {
      beforeEach(() => {
        config.featureToggles.withRemoteStorage = true;
      });

      afterEach(() => {
        config.featureToggles.withRemoteStorage = false;
      });

      it('should save grades in remote', async () => {
        // given
        const newGrades = JSON.stringify([{
          module: 'Module de test',
          matieres: [{ title: 'Test', evaluations: [{ title: 'CC', note: '13', noteRattrapage: '' }] }],
        }]);

        sinon.stub(axios, 'get').resolves({ data: htmlGrades });
        sinon.stub(axios, 'post').resolves();

        const storageClientGetStub = sinon.stub(storageClient, 'getObject');
        storageClientGetStub.resolves({
          Body: new Buffer.from(JSON.stringify([{
            module: 'Module de test',
            matieres: [{ title: 'Test', evaluations: [{ title: 'CC', note: 12 }],
            }],
          }])),
        });

        const storageClientPutStub = sinon.stub(storageClient, 'putObject');
        storageClientPutStub.resolves();

        // when
        await notifyNewGrades();

        // then
        expect(storageClientPutStub).to.have.been.calledWithExactly({ fileName: `${config.studentId}/grades.json`, fileContent: newGrades });
      });
    });
  });

  context('when oldGrades file not return grades', () => {
    it('should throw error', async () => {
      // given
      sinon.stub(fs, 'readFileSync').returns('');

      // when
      const error = await catchErr(notifyNewGrades)();

      // then
      expect(error.message).to.be.equal('oldGrades are not defined');
    });
  });

  context('when studentId are not defined', () => {
    it('should throw error', async () => {
      // given
      sinon.stub(fs, 'readFileSync').returns(JSON.stringify({ test: 'test' }));
      const oldValueForStudentId = config.studentId;
      config.studentId = undefined;

      // when
      const error = await catchErr(notifyNewGrades)();

      // then
      expect(error.message).to.be.equal('studentId are not defined');
      config.studentId = oldValueForStudentId;
    });
  });

  context('when school api not return grades', () => {
    it('should throw error', async () => {
      // given
      sinon.stub(fs, 'readFileSync').returns(JSON.stringify({ test: 'test' }));
      sinon.stub(axios, 'get').resolves({});

      // when
      const error = await catchErr(notifyNewGrades)();

      // then
      expect(error.message).to.be.equal('newGrades are not available');
    });
  });
});
