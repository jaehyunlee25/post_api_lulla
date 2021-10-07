select 
	p.grade grade
from permission_member pm
	left join permission p on pm.permission_id = p.id
where 
	pm.member_id = '${memberId}'
	and type = 1
	and action = ${action};