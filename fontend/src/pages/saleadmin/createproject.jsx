import { useState, useEffect } from "react";
import Select from "react-select";
import axios from "axios";
import Layout from "../../components/Layout";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import Swal from "sweetalert2";
import {
  FiArrowLeft,
  FiSave,
  FiUpload,
  FiMapPin,
  FiUser,
  FiPhone,
  FiHash,
  FiImage,
} from "react-icons/fi"; // Importing modern icons

export default function CreateProject() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    projectName: "",
    province: "",
    district: "",
    village: "",
    coordinator: "",
    phone: "",
    imageFile: null,
    status: "ລໍຖ້າດຳເນີນ",
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [provinceOptions, setProvinceOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [villageOptions, setVillageOptions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusOptions = [
    { value: "ລໍຖ້າດຳເນີນ", label: "ລໍຖ້າດຳເນີນ" },
    { value: "ຂັ້ນຕອນສະເໜີຂາຍ", label: "ຂັ້ນຕອນສະເໜີຂາຍ" },
    { value: "ຂັ້ນຕອນການເຮັດສັນຍາ", label: "ຂັ້ນຕອນການເຮັດສັນຍາ" },
    { value: "ຂັ້ນຕອນດຳເນີນໂຄງການ", label: "ຂັ້ນຕອນດຳເນີນໂຄງການ" },
  ];

  useEffect(() => {
    api.get("/provinces").then((res) => {
      if (res.data?.data) {
        setProvinceOptions(
          res.data.data.map((p) => ({ value: p.code, label: p.name_1 }))
        );
      }
    });
  }, []);

  useEffect(() => {
    if (formData.province) {
      api.get(`/districts?province=${formData.province}`)
        .then((res) => {
          if (res.data?.data) {
            setDistrictOptions(
              res.data.data.map((d) => ({ value: d.code, label: d.name_1 }))
            );
          }
        });
    } else {
      setDistrictOptions([]);
      setVillageOptions([]);
    }
    setFormData((prev) => ({ ...prev, district: "", village: "" }));
  }, [formData.province]);

  useEffect(() => {
    if (formData.province && formData.district) {
      api
        .get(
          `/villages?province=${formData.province}&district=${formData.district}`
        )
        .then((res) => {
          if (res.data?.data) {
            setVillageOptions(
              res.data.data.map((v) => ({ value: v.code, label: v.name_1 }))
            );
          }
        });
    } else {
      setVillageOptions([]);
    }
    setFormData((prev) => ({ ...prev, village: "" }));
  }, [formData.district]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, imageFile: file }));
      setPreviewImage(URL.createObjectURL(file));
    } else {
      setFormData((prev) => ({ ...prev, imageFile: null }));
      setPreviewImage(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
      if (key === "imageFile" && val) {
        payload.append("image", val);
      } else {
        payload.append(key, val);
      }
    });

    try {
      await api.post("/projects", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Swal.fire({
        icon: "success",
        title: "ສຳເລັດ!",
        text: "ຂໍ້ມູນໄດ້ຖືກບັນທຶກແລ້ວ",
        confirmButtonText: "ໄປທີ່ລາຍການ",
      }).then(() => {
        navigate("/sale-admin/listproject");
      });
    } catch (err) {
      console.error("Error creating project:", err);
      let errorMessage = "ກວດສອບຂໍ້ມູນ ຫຼື ລອງໃໝ່";
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      }
      Swal.fire({
        icon: "error",
        title: "ບັນທຶກບໍ່ສຳເລັດ",
        text: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/sale-admin/listproject")}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200 font-medium group"
        >
          <FiArrowLeft className="mr-2 text-lg group-hover:-translate-x-1 transition-transform duration-200" />
          ກັບຄືນໜ້າລາຍການໂຄງການ
        </button>
        <h1 className="text-3xl font-extrabold text-gray-800">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
            📦 ກຳນົດໂຄງການໃໝ່
          </span>
        </h1>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project Name */}
          <div>
            <label htmlFor="projectName" className="block text-sm font-semibold text-gray-700 mb-2">
              <FiHash className="inline-block mr-1 text-gray-500" /> ຊື່ໂຄງການ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="projectName"
              name="projectName"
              value={formData.projectName}
              onChange={handleChange}
              className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 placeholder-gray-400"
              placeholder="ປ້ອນຊື່ໂຄງການ"
              required
            />
          </div>

          {/* Province */}
          <div>
            <label htmlFor="province" className="block text-sm font-semibold text-gray-700 mb-2">
              <FiMapPin className="inline-block mr-1 text-gray-500" /> ແຂວງ <span className="text-red-500">*</span>
            </label>
            <Select
              id="province"
              options={provinceOptions}
              value={provinceOptions.find((p) => p.value === formData.province)}
              onChange={(opt) =>
                setFormData((prev) => ({
                  ...prev,
                  province: opt ? opt.value : "",
                }))
              }
              placeholder="ເລືອກແຂວງ"
              classNamePrefix="react-select"
              isClearable
              required
            />
          </div>

          {/* District */}
          <div>
            <label htmlFor="district" className="block text-sm font-semibold text-gray-700 mb-2">
              <FiMapPin className="inline-block mr-1 text-gray-500" /> ເມືອງ <span className="text-red-500">*</span>
            </label>
            <Select
              id="district"
              options={districtOptions}
              value={districtOptions.find((d) => d.value === formData.district)}
              onChange={(opt) =>
                setFormData((prev) => ({
                  ...prev,
                  district: opt ? opt.value : "",
                }))
              }
              isDisabled={!formData.province || districtOptions.length === 0}
              placeholder="ເລືອກເມືອງ"
              classNamePrefix="react-select"
              isClearable
              required
            />
          </div>

          {/* Village */}
          <div>
            <label htmlFor="village" className="block text-sm font-semibold text-gray-700 mb-2">
              <FiMapPin className="inline-block mr-1 text-gray-500" /> ບ້ານ <span className="text-red-500">*</span>
            </label>
            <Select
              id="village"
              options={villageOptions}
              value={villageOptions.find((v) => v.value === formData.village)}
              onChange={(opt) =>
                setFormData((prev) => ({
                  ...prev,
                  village: opt ? opt.value : "",
                }))
              }
              isDisabled={!formData.district || villageOptions.length === 0}
              placeholder="ເລືອກບ້ານ"
              classNamePrefix="react-select"
              isClearable
              required
            />
          </div>

          {/* Coordinator */}
          <div>
            <label htmlFor="coordinator" className="block text-sm font-semibold text-gray-700 mb-2">
              <FiUser className="inline-block mr-1 text-gray-500" /> ຜູ້ປະສານງານ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="coordinator"
              name="coordinator"
              value={formData.coordinator}
              onChange={handleChange}
              className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 placeholder-gray-400"
              placeholder="ປ້ອນຊື່ຜູ້ປະສານງານ"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
              <FiPhone className="inline-block mr-1 text-gray-500" /> ເບີໂທ <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 placeholder-gray-400"
              placeholder="ຕົວຢ່າງ: 020-xxxxxxx"
              // pattern="[0-9]{3}-[0-9]{7}"
              title="ກະລຸນາປ້ອນເບີໂທໃນຮູບແບບ 020-xxxxxxx"
              required
            />
          </div>

          {/* Status */}
          <div className="md:col-span-2">
            <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">
              <FiHash className="inline-block mr-1 text-gray-500" /> ສະຖານະໂຄງການ <span className="text-red-500">*</span>
            </label>
            <Select
              id="status"
              options={statusOptions}
              value={statusOptions.find((s) => s.value === formData.status)}
              onChange={(opt) =>
                setFormData((prev) => ({
                  ...prev,
                  status: opt ? opt.value : "ລໍຖ້າດຳເນີນ", // Default if cleared
                }))
              }
              placeholder="ເລືອກສະຖານະ"
              classNamePrefix="react-select"
              isClearable={false} // Status should always have a value
              required
            />
          </div>

          {/* Image Upload */}
          <div className="md:col-span-2">
            <label htmlFor="imageFile" className="block text-sm font-semibold text-gray-700 mb-2">
              <FiImage className="inline-block mr-1 text-gray-500" /> ຮູບພາບໂຄງການ
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                id="imageFile"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden" // Hide default input
              />
              <label
                htmlFor="imageFile"
                className="cursor-pointer bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center gap-2 shadow-md"
              >
                <FiUpload /> ເລືອກຮູບພາບ
              </label>
              {previewImage && (
                <div className="relative w-32 h-32 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewImage(null);
                      setFormData((prev) => ({ ...prev, imageFile: null }));
                      // Clear the file input visually as well
                      const fileInput = document.getElementById('imageFile');
                      if (fileInput) fileInput.value = '';
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-600 transition-colors duration-200"
                    title="ລຶບຮູບພາບ"
                  >
                    X
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2 flex justify-end mt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`py-3 px-8 rounded-lg font-semibold text-white transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl ${
                isSubmitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 transform hover:scale-105"
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
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
                  ກຳລັງບັນທຶກ...
                </>
              ) : (
                <>
                  <FiSave className="text-xl" /> ບັນທຶກໂຄງການ
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}