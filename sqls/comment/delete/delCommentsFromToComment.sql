delete from
    comment
where
    id in (select 
                tocomment_id
            from
                tocomment
            where
                comment_id = '${commentId}');