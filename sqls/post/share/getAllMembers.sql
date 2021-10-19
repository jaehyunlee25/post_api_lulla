select 
    m.id 
from members m
    left join school_roles sr on sr.id = m.school_role_id
where 
    m.id in (select 
                m.id 
            from members m
                join school_roles sr on sr.id = m.school_role_id
            where 
                m.school_id = '${schoolId}'
                and sr.grade > 4)
    and sr.grade = 5;