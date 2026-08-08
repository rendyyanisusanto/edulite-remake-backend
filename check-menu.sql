-- Query untuk verifikasi data menu yang baru dimasukkan

-- 1. Cek menu group "Absensi Siswa"
SELECT * FROM menu_groups WHERE name = 'Absensi Siswa';

-- 2. Cek menus di dalam "Absensi Siswa"
SELECT m.*, mg.name as group_name
FROM menus m
JOIN menu_groups mg ON m.group_id = mg.id
WHERE mg.name = 'Absensi Siswa'
ORDER BY m.sort_order;

-- 3. Cek permissions untuk student attendance
SELECT * FROM permissions WHERE code LIKE 'attendance.%';

-- 4. Cek role_permissions untuk SUPERADMIN
SELECT rp.*, r.name as role_name, p.code as permission_code
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'SUPERADMIN' AND p.code LIKE 'attendance.%';
