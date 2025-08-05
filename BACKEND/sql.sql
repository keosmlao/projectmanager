
CREATE TABLE odg_project_manager_user (
  roworder SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR,
  role 
);


CREATE TABLE odg_project_manager_user (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL  -- e.g. 'sale_admin', 'service_manager'
);


CREATE TABLE odg_projects (
  id SERIAL PRIMARY KEY,
  project_name TEXT NOT NULL,
  province TEXT NOT NULL,
  district TEXT NOT NULL,
  village TEXT NOT NULL,
  coordinator TEXT NOT NULL,
  phone TEXT NOT NULL,
  image_url TEXT, -- ສາມາດເກັບ URL ຂອງຮູບໄດ້
  status project_status NOT NULL DEFAULT 'ລໍຖ້າດຳເນີນ',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  project_description TEXT,
   start_date DATE,
   end_date DATE;
);



CREATE TYPE project_status AS ENUM (
  'ລໍຖ້າດຳເນີນ',
  'ຂັ້ນຕອນສະເໜີຂາຍ',
  'ຂັ້ນຕອນການເຮັດສັນຍາ',
  'ຂັ້ນຕອນດຳເນີນໂຄງການ'
);
