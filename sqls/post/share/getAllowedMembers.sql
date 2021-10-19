select 
    m.id 
from members m
    left join school_roles sr on sr.id = m.school_role_id
where 
    (
        m.id in 
            (select 
                am.member_id 
            from allowed_member am 
            where am.post_id = '${postId}') 
        or m.id in 
            (select m.id 
            from members m 
            where 
                m.class_id in 
                    (select ac.class_id 
                    from allowed_class ac
                    where ac.post_id = '${postId}')
            )
    ) 
    and sr.grade = 5;