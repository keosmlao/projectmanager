import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
import psycopg2
from datetime import timedelta
from psycopg2.extras import RealDictCursor
# app = Flask(__name__)
app = Flask(__name__, static_url_path='/static', static_folder='static')
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = "uploads/project_requests"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
CORS(app)
bcrypt = Bcrypt(app)

app.config['JWT_SECRET_KEY'] = 'your-secret-key'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(minutes=1)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=7)
jwt = JWTManager(app)

# PostgreSQL connection
def get_conn():
    return psycopg2.connect(
        dbname='odg_test', user='postgres', password='od@2022', host='183.182.125.245', port='5432'
    )

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id, username, password_hash, role FROM odg_project_manager_user WHERE username=%s", (username,))
        result = cur.fetchone()

    if result and bcrypt.check_password_hash(result[2], password):
        identity = {
            "user_id": result[0],
            "username": result[1],
            "role": result[3]
        }
        access_token = create_access_token(identity=identity)
        refresh_token = create_refresh_token(identity=identity)
        return jsonify(access_token=access_token, refresh_token=refresh_token)

    return jsonify({"msg": "Invalid username or password"}), 401

@app.route("/api/protected", methods=["GET"])
@jwt_required()
def protected():
    user = get_jwt_identity()
    return jsonify(user=user)

@app.route("/api/provinces")
def get_province():
    with get_conn() as conn:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT  code, name_1 FROM erp_province  order by code ASC")
        result = cur.fetchall()
        return jsonify({"success": True, "data": result})
    
@app.route("/api/districts", methods=["GET"])
def get_districts():
    province = request.args.get("province")
    with get_conn() as conn:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT  code, name_1 FROM erp_amper  where  province=%s order by code ASC",(province,))
        result = cur.fetchall()
        return jsonify({"success": True, "data": result}) 



@app.route("/api/villages", methods=["GET"])
def get_villages():
    province = request.args.get("province")
    district = request.args.get("district")
    province = request.args.get("province")
    with get_conn() as conn:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT  code, name_1 FROM erp_tambon where province=%s and  amper=%s order by code ASC ",(province,district))
        result = cur.fetchall()
        return jsonify({"success": True, "data": result}) 



# 📌 GET all projects
@app.route("/api/projects", methods=["GET"])
def get_projects():
    with get_conn() as conn:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM odg_projects ORDER BY created_at DESC")
        data = cur.fetchall()
    return jsonify({"data": data, "success": True})

# 📌 POST new project
@app.route("/api/projects", methods=["POST"])
def create_project():
    data = request.form
    image = request.files.get("image")

    image_url = None
    if image:
        image_path = os.path.join("static/uploads", image.filename)
        image.save(image_path)
        image_url = f"/{image_path}"

    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO odg_projects 
            (project_name, province, district, village, coordinator, phone, image_url, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            data.get("projectName"),
            data.get("province"),
            data.get("district"),
            data.get("village"),
            data.get("coordinator"),
            data.get("phone"),
            image_url,
            data.get("status", "ລໍຖ້າດຳເນີນ")
        ))
        conn.commit()
    return jsonify({"success": True, "message": "Created"})

# 📌 PUT update project status
@app.route("/api/projects/<int:project_id>", methods=["PUT"])
def update_status(project_id):
    status = request.json.get("status")
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            UPDATE odg_projects SET status = %s WHERE id = %s
        """, (status, project_id))
        conn.commit()
    return jsonify({"success": True, "message": "Updated"})

# 📌 DELETE a project
@app.route("/api/projects/<int:project_id>", methods=["DELETE"])
def delete_project(project_id):
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM odg_projects WHERE id = %s", (project_id,))
        conn.commit()
    return jsonify({"success": True, "message": "Deleted"})  

@app.route("/api/projects/<int:project_id>", methods=["GET"])
def get_project_by_id(project_id):
    with get_conn() as conn:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT id, project_name, project_description, start_date, end_date
            FROM odg_projects
            WHERE id = %s
        """, (project_id,))
        row = cur.fetchone()
        if row:
            return jsonify({"success": True, "data": row})
        else:
            return jsonify({"success": False, "message": "Project not found"}), 404
        
from werkzeug.utils import secure_filename
import os

UPLOAD_FOLDER = "uploads/project_requests"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/api/project-requests", methods=["POST"])
def create_project_request():
    project_description = request.form.get("project_description")
    start_date = request.form.get("start_date")
    end_date = request.form.get("end_date")
    existing_project_id = request.form.get("existing_project_id")

    attachments = request.files.getlist("attachments")

    with get_conn() as conn:
        cur = conn.cursor()

        # ✅ Update project info
        cur.execute("""
            UPDATE odg_projects
            SET project_description = %s,
                start_date = %s,
                end_date = %s,request_status=1
            WHERE id = %s
        """, (project_description, start_date, end_date, existing_project_id))

        # ✅ Save attachments
        for file in attachments:
            if file:
                filename = secure_filename(file.filename)
                save_path = os.path.join(UPLOAD_FOLDER, f"{existing_project_id}_{filename}")
                file.save(save_path)

                cur.execute("""
                    INSERT INTO odg_project_request_attachments (request_id, file_name, file_path)
                    VALUES (%s, %s, %s)
                """, (existing_project_id, filename, save_path))

        conn.commit()

    return jsonify({"success": True, "message": "Request submitted and project updated."})


if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5000)
