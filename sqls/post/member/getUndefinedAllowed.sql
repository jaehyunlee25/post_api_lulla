select 
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
                                            m.id member_id ,
                                            f.address member_image, 
                                            c.name class_name, 
                                            k.name kid_name
                                        from 
                                            members m
                                            join file f on m.image_id = f.id
                                            join kid k on k.id = m.kid_id
                                        where 
                                            m.class_id = c.id 
                                            and m.kid_id is not null 
                                            and k.name is not null
                                    ) tmp
                                )
                            ) allowed_member
                        )
                    from 
                        class c
                    where 
                        c.school_id ='${schoolId}'
                ) tmp
            )
        ) allowed_class
    ) 
from 
    schools s 
where 
    s.id = '${schoolId}';