import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import Swal from "sweetalert2";
import api from "../../api";
import { FiUpload, FiFile, FiImage, FiXCircle, FiSave, FiArrowLeft } from "react-icons/fi";

// Helper function to get today's date in YYYY-MM-DD format for default values
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function RequestProjectCreation() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  // --- CHANGE STARTS HERE ---
  // Set projectName to an empty string initially
  const [projectName, setProjectName] = useState("");
  // --- CHANGE ENDS HERE ---

  const [projectDescription, setProjectDescription] = useState("");
  const [startDate, setStartDate] = useState(getTodayDate());
  const [endDate, setEndDate] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [existingProject, setExistingProject] = useState(null);

  useEffect(() => {
    if (projectId) {
      const fetchProjectDetails = async () => {
        setLoading(true);
        try {
          const res = await api.get(`/projects/${projectId}`);
          setExistingProject(res.data.data);
          // If you want to pre-fill from an existing project, ensure it's handled here.
          // Otherwise, projectName remains empty as set in useState.
          setProjectName(res.data.data.project_name || ""); // This line will override the empty string if a project is loaded
          setProjectDescription(res.data.data.project_description || "");
          setStartDate(res.data.data.start_date || getTodayDate());
          setEndDate(res.data.data.end_date || "");
        } catch (error) {
          console.error(`Failed to fetch project details for ID ${projectId}:`, error);
          Swal.fire("Error", "Could not load existing project details.", "error");
        } finally {
          setLoading(false);
        }
      };
      fetchProjectDetails();
    }
  }, [projectId]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map((file) => ({
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      type: file.type,
    }));
    setAttachedFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };

  const handleRemoveFile = (index) => {
    if (attachedFiles[index].preview) {
      URL.revokeObjectURL(attachedFiles[index].preview);
    }
    setAttachedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  useEffect(() => {
    return () => {
      attachedFiles.forEach(item => {
        if (item.preview) {
          URL.revokeObjectURL(item.preview);
        }
      });
    };
  }, [attachedFiles]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (endDate && new Date(startDate) > new Date(endDate)) {
      Swal.fire("ຜິດພາດ", "ວັນທີເລີ່ມຕົ້ນ ຕ້ອງບໍ່ໃຫຍ່ກວ່າ ວັນທີສິ້ນສຸດ.", "error");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("project_name", projectName);
    formData.append("project_description", projectDescription);
    formData.append("start_date", startDate);
    formData.append("end_date", endDate);

    if (existingProject) {
      formData.append("existing_project_id", existingProject.id);
    }

    attachedFiles.forEach((item) => {
      formData.append("attachments", item.file);
    });

    try {
      await api.post("/project-requests", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      Swal.fire("ສຳເລັດ!", "ຄຳຂໍສ້າງໂຄງການຖືກສົ່ງແລ້ວ.", "success");
      navigate("/sale-admin/listproject");
    } catch (error) {
      console.error("Failed to submit project request:", error);
      Swal.fire("ຜິດພາດ", "ບໍ່ສາມາດສົ່ງຄຳຂໍສ້າງໂຄງການໄດ້.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-800">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            📝 ຂໍສ້າງໂຄງການ
          </span>
        </h1>
        <button
          onClick={() => navigate("/sale-admin/listproject")}
          className="bg-gray-400 text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-500 transition-all duration-300 flex items-center gap-2"
        >
          <FiArrowLeft /> ກັບຄືນ
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        {existingProject && (
          <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 mb-6 rounded-md" role="alert">
            <p className="font-bold">ກຳລັງສ້າງຄຳຂໍສຳລັບໂຄງການ:</p>
            <p>
              ID: **{existingProject.id}** - ຊື່ໂຄງການ: **{existingProject.project_name}**
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="projectName" className="block text-gray-700 text-sm font-bold mb-2">
              ຊື່ໂຄງການ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="projectName"
              readOnly
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-400"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-gray-700 text-sm font-bold mb-2">
                ວັນທີເລີ່ມ <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="startDate"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-400"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-gray-700 text-sm font-bold mb-2">
                ວັນທີສິ້ນສຸດ
              </label>
              <input
                type="date"
                id="endDate"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-400"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="projectDescription" className="block text-gray-700 text-sm font-bold mb-2">
              ລາຍລະອຽດໂຄງການ
            </label>
            <textarea
              id="projectDescription"
              rows="4"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-400"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
            ></textarea>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              ໄຟລ໌ແນບ (ຮູບພາບ, PDF)
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              accept="image/*,.pdf"
            />
            <p className="mt-2 text-xs text-gray-500">
              ຮອງຮັບໄຟລ໌: .jpg, .jpeg, .png, .gif, .pdf (ຂະໜາດສູງສຸດແນະນຳ 5MB ຕໍ່ໄຟລ໌)
            </p>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {attachedFiles.map((item, index) => (
                <div
                  key={index}
                  className="relative border rounded-lg p-2 flex flex-col items-center justify-center text-center bg-gray-50 group"
                >
                  {item.preview ? (
                    <img src={item.preview} alt="preview" className="max-h-24 w-auto object-contain rounded mb-2" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <FiFile className="text-4xl text-gray-400 mb-2" />
                      <span className="text-xs text-gray-600 truncate w-full px-1">
                        {item.file.name}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-75 hover:opacity-100 transition-opacity duration-200"
                    title="ລຶບໄຟລ໌"
                  >
                    <FiXCircle className="text-lg" />
                  </button>
                  <span className="mt-1 text-xs text-gray-500">
                    {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 mr-3 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                ກຳລັງສົ່ງ...
              </>
            ) : (
              <>
                <FiSave className="text-xl" /> ສົ່ງຄຳຂໍ
              </>
            )}
          </button>
        </form>
      </div>
    </Layout>
  );
}