import { RESPOND, ERROR, getUserIdFromToken } from '../../../lib/apiCommon';
import '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getSurvey: 'getSurveyById',
};
const baseUrl = 'sqls/survey/survey'; // 끝에 슬래시 붙이지 마시오.
// req.body를 만들지 않도록 한다.
// export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  // #1. cors 해제
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*', // for same origin policy
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': ['Content-Type', 'Authorization'], // for application/json
    'Access-Control-Allow-Methods': 'GET',
  });
  // #2. preflight 처리
  // if (req.method === 'OPTIONS') return RESPOND(res, {});

  // #3.1.
  try {
    return await main(req, res);
  } catch (e) {
    return ERROR(res, {
      id: 'ERR.survey.survey.3.2.2',
      message: 'post server logic error',
      error: e.toString(),
    });
  }
}
async function main(req, res) {
  // #3.1. 사용자 토큰을 이용해 userId를 추출한다.
  // 이 getUserIdFromToken 함수는 user의 활성화 여부까지 판단한다.
  // userId가 정상적으로 리턴되면, 활성화된 사용자이다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.1');

  const { id: surveyId } = req.query;

  // #3.2 survey 검색
  const qSurvey = await QTS.getSurvey.fQuery(baseUrl, { surveyId });
  if (qSurvey.type === 'error')
    return qSurvey.onError(res, '3.2', 'searching survey');

  const data = qSurvey.message.rows[0];

  return RESPOND(res, {
    data,
    message: '설문조사 정보를 가져오는데에 성공했습니다.',
    resultCode: 200,
  });
}
