const proxyRequest = require("../utils/proxy");

const routes = async (req, res, pathname) => {

  // STUDENTS
  if (pathname.startsWith("/students")) {
    return proxyRequest(req, res, process.env.STUDENT_SERVICE_URL);
  }

  // SUBJECTS 
  if (pathname.startsWith("/subjects")) {
    return proxyRequest(req, res, process.env.STUDENT_SERVICE_URL);
  }

  // GRADES
  if (pathname.startsWith("/grades")) {
    return proxyRequest(req, res, process.env.GRADES_SERVICE_URL);
  }

  //STUDENT-SUBJECTS
  if (pathname.startsWith("/student-subjects")) {
    return proxyRequest(req, res, process.env.STUDENT_SERVICE_URL);
  }

  return false;
};

module.exports = routes;