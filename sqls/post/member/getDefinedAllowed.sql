select 
    (select 
        array_to_json(
            array(
                select 
                    row_to_json(tmp) 
                from
                    (select 
                        m.nickname member_nickname, 
                        m.id member_id, 
                        f.address member_image, 
                        k.name kid_name, 
                        c.name class_name, 
                        c.id class_id 
                    from 
                        allowed_member am
                        join members m on am.member_id = m.id 
                        left join file f on m.image_id = f.id
                        join class c on m.class_id = c.id 
                        left join kid k on k.id = m.kid_id
                    where 
                        am.post_id = p.id) tmp
            )
        ) allowed_member
    ), 
    (select 
        array_to_json(
        array(
            select 
                row_to_json(tmp) 
            from 
                (select 
                    c.name class_name, 
                    c.id class_id, 
                    (select 
                        array_to_json(
                            array(
                                select 
                                    row_to_json(tmp) 
                                from
                                    (select 
                                        m.nickname member_nickname, 
                                        m.id member_id,
                                        f.address member_image, 
                                        c.name class_name, 
                                        c.id class_id, 
                                        k.name kid_name
                                    from 
                                        members m 
                                        join file f on m.image_id = f.id 
                                        join class c on c.id = m.class_id 
                                        join kid k on k.id = m.kid_id
                                    where 
                                        m.class_id = ac.class_id 
                                        and m.kid_id is not null
                                ) tmp
                            )
                        ) allowed_member
                    )
                from allowed_class ac
                    join class c on ac.class_id = c.id 
                where 
                    ac.post_id = p.id
                ) tmp
            )
        ) allowed_class
    )
from 
    post p 
where 
    p.id = '${postId}';