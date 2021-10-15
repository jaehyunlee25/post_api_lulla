update
    comment
set
    content = '${content}',
    is_modified = true
where
    id = '${commentId}';