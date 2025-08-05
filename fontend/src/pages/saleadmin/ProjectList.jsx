import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import Layout from "../../components/Layout";
import Select from "react-select";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import {
  FiPlus,
  FiSearch,
  FiDownload,
  FiChevronLeft,
  FiChevronRight,
  FiTrash, // Import for delete icon
  FiFilePlus, // Import for request project icon
} from "react-icons/fi";

const statusTabs = [
  "ທັງໝົດ",
  "ລໍຖ້າດຳເນີນ",
  "ຂັ້ນຕອນສະເໜີຂາຍ",
  "ຂັ້ນຕອນການເຮັດສັນຍາ",
  "ຂັ້ນຕອນດຳເນີນໂຄງການ",
];

const statusOptions = [
  { value: "ລໍຖ້າດຳເນີນ", label: "ລໍຖ້າດຳເນີນ" },
  { value: "ຂັ້ນຕອນສະເໜີຂາຍ", label: "ຂັ້ນຕອນສະເໜີຂາຍ" },
  { value: "ຂັ້ນຕອນການເຮັດສັນຍາ", label: "ຂັ້ນຕອນການເຮັດສັນຍາ" },
  { value: "ຂັ້ນຕອນດຳເນີນໂຄງການ", label: "ຂັ້ນຕອນດຳເນີນໂຄງການ" },
];

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("ທັງໝົດ");
  const [search, setSearch] = useState("");
  // Set default dates to today
  const [fromDate, setFromDate] = useState(getTodayDate());
  const [toDate, setToDate] = useState(getTodayDate());
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);

  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedVillage, setSelectedVillage] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
    api.get("/provinces").then((res) =>
      setProvinces(res.data.data.map((p) => ({ label: p.name_1, value: p.code })))
    );
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get("/projects");
      setProjects(res.data.data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      Swal.fire("Error", "Failed to load projects.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProvince) {
      api.get(`/districts?province=${selectedProvince.value}`).then((res) =>
        setDistricts(res.data.data.map((d) => ({ label: d.name_1, value: d.code })))
      );
    } else {
      setDistricts([]);
      setSelectedDistrict(null);
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedProvince && selectedDistrict) {
      api
        .get(`/villages?province=${selectedProvince.value}&district=${selectedDistrict.value}`)
        .then((res) =>
          setVillages(res.data.data.map((v) => ({ label: v.name_1, value: v.code })))
        );
    } else {
      setVillages([]);
      setSelectedVillage(null);
    }
  }, [selectedDistrict]);

  useEffect(() => {
    let data = projects;

    if (selectedStatus !== "ທັງໝົດ") {
      data = data.filter((p) => p.status === selectedStatus);
    }

    if (selectedProvince) data = data.filter((p) => p.province === selectedProvince.value);
    if (selectedDistrict) data = data.filter((p) => p.district === selectedDistrict.value);
    if (selectedVillage) data = data.filter((p) => p.village === selectedVillage.value);

    if (search) {
      const s = search.toLowerCase();
      data = data.filter((p) =>
        [p.project_name, p.coordinator, p.phone, p.province, p.district, p.village]
          .join(" ")
          .toLowerCase()
          .includes(s)
      );
    }

    // Apply date filters if they are set
    if (fromDate) {
      data = data.filter((p) => {
        const projectDate = new Date(p.created_at);
        const filterFromDate = new Date(fromDate);
        // Ensure comparison is only by date, not time
        projectDate.setHours(0, 0, 0, 0);
        filterFromDate.setHours(0, 0, 0, 0);
        return projectDate >= filterFromDate;
      });
    }
    if (toDate) {
      data = data.filter((p) => {
        const projectDate = new Date(p.created_at);
        const filterToDate = new Date(toDate);
        // Ensure comparison is only by date, not time
        projectDate.setHours(0, 0, 0, 0);
        filterToDate.setHours(0, 0, 0, 0);
        return projectDate <= filterToDate;
      });
    }

    setFiltered(data);
    setPage(1);
  }, [
    projects,
    selectedStatus,
    selectedProvince,
    selectedDistrict,
    selectedVillage,
    search,
    fromDate,
    toDate,
  ]);

  const handleStatusChange = async (projectId, newStatus) => {
    try {
      const updatedProjects = projects.map((p) =>
        p.id === projectId ? { ...p, status: newStatus } : p
      );
      setProjects(updatedProjects);
      setFiltered(updatedProjects);

      await api.put(`/projects/${projectId}`, { status: newStatus });
      Swal.fire("ສຳເລັດ!", "ສະຖານະໂຄງການໄດ້ຖືກອັບເດດແລ້ວ.", "success");
    } catch (error) {
      console.error("Failed to update project status:", error);
      Swal.fire("ຜິດພາດ", "ບໍ່ສາມາດອັບເດດສະຖານະໂຄງການໄດ້.", "error");
      fetchProjects();
    }
  };

  const handleDeleteProject = async (projectId) => {
    Swal.fire({
      title: "ທ່ານແນ່ໃຈບໍ່?",
      text: "ທ່ານຈະບໍ່ສາມາດຍົກເລີກການລຶບນີ້ໄດ້!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ແມ່ນແລ້ວ, ລຶບເລີຍ!",
      cancelButtonText: "ຍົກເລີກ",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/projects/${projectId}`);
          setProjects(projects.filter((p) => p.id !== projectId));
          Swal.fire("ສຳເລັດ!", "ໂຄງການຖືກລຶບອອກແລ້ວ.", "success");
        } catch (error) {
          console.error("Failed to delete project:", error);
          Swal.fire("ຜິດພາດ", "ບໍ່ສາມາດລຶບໂຄງການໄດ້.", "error");
        }
      }
    });
  };

  const handleRequestProjectCreation = (projectId) => {
    // Navigate to a new page for creating projects, possibly passing project ID
    // for pre-filling some information or linking.
    navigate(`/sale-admin/request-project-creation/${projectId}`);
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Projects");
    XLSX.writeFile(wb, "projects.xlsx");
  };

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-800">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            📋 ລາຍການໂຄງການ
          </span>
        </h1>
        <button
          onClick={() => navigate("/sale-admin/create-project")}
          className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
        >
          <FiPlus className="text-xl" /> ສ້າງໃໝ່
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md mb-6">
        <div className="flex flex-wrap gap-3 mb-4 justify-center md:justify-start">
          {statusTabs.map((status) => (
            <button
              key={status}
              className={`px-5 py-2 rounded-full border-2 transition-all duration-300 ${
                selectedStatus === status
                  ? "bg-blue-600 text-white border-blue-600 shadow-md"
                  : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
              }`}
              onClick={() => setSelectedStatus(status)}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Select
            options={provinces}
            value={selectedProvince}
            onChange={setSelectedProvince}
            placeholder="ແຂວງ"
            classNamePrefix="react-select"
            isClearable
          />
          <Select
            options={districts}
            value={selectedDistrict}
            onChange={setSelectedDistrict}
            placeholder="ເມືອງ"
            isDisabled={!selectedProvince}
            classNamePrefix="react-select"
            isClearable
          />
          <Select
            options={villages}
            value={selectedVillage}
            onChange={setSelectedVillage}
            placeholder="ບ້ານ"
            isDisabled={!selectedDistrict}
            classNamePrefix="react-select"
            isClearable
          />
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 ຄົ້ນຫາ..."
              className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
          />
          <button
            onClick={exportToExcel}
            className="bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-yellow-600 transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <FiDownload className="text-xl" /> ສົ່ງອອກ Excel
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-600 text-lg flex items-center gap-2">
            <svg
              className="animate-spin h-6 w-6 text-blue-500"
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
            ກຳລັງໂຫຼດ...
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white p-6 rounded-xl shadow-md overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ຊື່ໂຄງການ
                  </th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ແຂວງ
                  </th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ເມືອງ
                  </th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ບ້ານ
                  </th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ຜູ້ປະສານ
                  </th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ເບີໂທ
                  </th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ສະຖານະ
                  </th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ຈັດການ
                  </th>{" "}
                  {/* New column for actions */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginated.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="p-4 whitespace-nowrap font-medium text-gray-900">
                      {p.project_name}
                    </td>
                    <td className="p-4 whitespace-nowrap text-gray-600">{p.province}</td>
                    <td className="p-4 whitespace-nowrap text-gray-600">{p.district}</td>
                    <td className="p-4 whitespace-nowrap text-gray-600">{p.village}</td>
                    <td className="p-4 whitespace-nowrap text-gray-600">{p.coordinator}</td>
                    <td className="p-4 whitespace-nowrap text-gray-600">{p.phone}</td>
                    <td className="p-4 whitespace-nowrap w-48">
                      <Select
                        options={statusOptions}
                        value={statusOptions.find((opt) => opt.value === p.status)}
                        onChange={(selectedOpt) =>
                          handleStatusChange(p.id, selectedOpt ? selectedOpt.value : "")
                        }
                        classNamePrefix="react-select"
                        menuPortalTarget={document.body}
                        styles={{
                          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          control: (base) => ({
                            ...base,
                            minHeight: '36px',
                          }),
                        }}
                      />
                    </td>
                    <td className="p-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {p.status === "ລໍຖ້າດຳເນີນ" && (
                          <button
                            onClick={() => handleDeleteProject(p.id)}
                            className="text-red-600 hover:text-red-900 bg-red-100 p-2 rounded-full hover:bg-red-200 transition-colors duration-200"
                            title="ລຶບໂຄງການ"
                          >
                            <FiTrash className="text-lg" />
                          </button>
                        )}
                        {p.status === "ຂັ້ນຕອນດຳເນີນໂຄງການ" && (
                          <button
                            onClick={() => handleRequestProjectCreation(p.id)}
                            className="text-blue-600 hover:text-blue-900 bg-blue-100 p-2 rounded-full hover:bg-blue-200 transition-colors duration-200"
                            title="ຂໍສ້າງໂຄງການ"
                          >
                            <FiFilePlus className="text-lg" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan="8" className="p-4 text-center text-gray-500">
                      ບໍ່ມີຂໍ້ມູນໂຄງການ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <FiChevronLeft className="text-xl" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  page === i + 1
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <FiChevronRight className="text-xl" />
            </button>
          </div>
        </>
      )}
    </Layout>
  );
}