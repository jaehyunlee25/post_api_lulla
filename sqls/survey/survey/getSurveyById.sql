select 
    s.id, 
    CAST(
        (select 
            count(*) 
        from 
            survey_question sq 
        where 
            sq.survey_id = s.id
        ) 
    AS INTEGER) question_count, 
    to_char(s.end_date, 'YYYY-MM-DD"T12:00:00.000Z"') survey_end_date 
from 
    survey s 
where 
    s.id = '${surveyId}';