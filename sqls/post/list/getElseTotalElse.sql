select 
    count(p.id)
from 
    post p
where 
    and p.post_type = 0 
    and (
            -- principle data   
            (
                (p.school_id = '${schoolId}'
                and 0 = (select count(*) from allowed_member am where am.post_id = p.id )
                and 0 = (select count(*) from allowed_class ac where ac.post_id = p.id))
            )
            -- allowed_member_compare
            or 1 = (select count(*) 
                    from allowed_member am 
                    where 
                        am.post_id = p.id 
                        and am.member_id = '${memberId}')
            -- allowed_class_compare
            or 1 = (select count(*) 
                from allowed_class ac 
                where 
                    ac.post_id = p.id 
                    and ac.class_id = '${classId}'
                )
        )
    and p.is_published = ${isPublished};