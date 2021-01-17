const {  createTemplateForSlack, getCoursesDifferences, getGrades, gradesHtmlToJson, readGradesInFile, writeGradesInFile, sendGrades } = require('../../index');
require('dotenv').config();
const config = require('../../config');
const _ = require('lodash');

module.exports = async function notifyNewGrades() {
  const oldGrades = readGradesInFile('test.json');
  if (!oldGrades) {
    throw new Error('oldGrades are not defined');
  }

  const studentId = config.studentId;
  if (!studentId) {
    throw new Error('studentId are not defined');
  }
  
  let newGrades = await getGrades(studentId);
  if (!newGrades) {
    throw new Error('newGrades are not available');
  }

  newGrades = gradesHtmlToJson(newGrades);
  const getDifferences = getCoursesDifferences(newGrades, oldGrades);

  if (!_.isEmpty(getDifferences)) {
    const template = createTemplateForSlack(getDifferences);

    writeGradesInFile(newGrades, 'test.json');
    await sendGrades({ blocks: template });

    return 'New grades notifications are send';
  } else {
    return 'No new grades';
  }
};
