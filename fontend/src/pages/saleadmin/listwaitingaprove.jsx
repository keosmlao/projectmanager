import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../api";
import Swal from "sweetalert2";
import Select from "react-select";
import {
    FiCheckCircle,
    FiXCircle,
    FiFileText,
    FiEye,
    FiDownload,
    FiX,
    FiSearch,
    FiChevronLeft,
    FiChevronRight
} from "react-icons/fi";

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

export default function ListApprove() {
    const [projects, setProjects] = useState([]);
    const [filteredProjects, setFilteredProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedAttachments, setSelectedAttachments] = useState([]);

    // Filter States
    const [search, setSearch] = useState("");
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [villages, setVillages] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [selectedVillage, setSelectedVillage] = useState(null);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    // Pagination States
    const [page, setPage] = useState(1);
    const [perPage] = useState(10);

    useEffect(() => {
        fetchData();
        api.get("/provinces").then((res) =>
            setProvinces(res.data.data.map((p) => ({ label: p.name_1, value: p.code })))
        );
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get("/projectwaitingapprove");
            setProjects(res.data.data);
        } catch (error) {
            console.error("Failed to fetch projects:", error);
            Swal.fire("ຜິດພາດ", "ບໍ່ສາມາດໂຫຼດລາຍການຂໍອະນຸມັດໂຄງການໄດ້.", "error");
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

        // Apply search filter
        if (search) {
            const s = search.toLowerCase();
            data = data.filter(p =>
                [p.project_name, p.province_name, p.district_name, p.village_name, p.coordinator, p.phone]
                    .join(" ").toLowerCase().includes(s)
            );
        }

        // Apply location filters
        if (selectedProvince) data = data.filter(p => p.province === selectedProvince.value);
        if (selectedDistrict) data = data.filter(p => p.district === selectedDistrict.value);
        if (selectedVillage) data = data.filter(p => p.village === selectedVillage.value);

        // Apply date filters
        if (fromDate) {
            data = data.filter(p => new Date(p.created_at) >= new Date(fromDate));
        }
        if (toDate) {
            data = data.filter(p => {
                const projectDate = new Date(p.created_at);
                const filterToDate = new Date(toDate);
                projectDate.setHours(0, 0, 0, 0);
                filterToDate.setHours(0, 0, 0, 0);
                return projectDate <= filterToDate;
            });
        }

        setFilteredProjects(data);
        setPage(1); // Reset to first page on filter change
    }, [projects, search, selectedProvince, selectedDistrict, selectedVillage, fromDate, toDate]);

    const handleApprove = async (projectId) => {
        Swal.fire({
            title: "ທ່ານແນ່ໃຈບໍ່?",
            text: "ທ່ານຕ້ອງການອະນຸມັດໂຄງການນີ້ແທ້ບໍ?",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "ແມ່ນ, ອະນຸມັດ!",
            cancelButtonText: "ຍົກເລີກ",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.put(`/projects/approve/${projectId}`);
                    Swal.fire("ສຳເລັດ!", "ໂຄງການຖືກອະນຸມັດແລ້ວ.", "success");
                    fetchData(); // Refresh the list
                } catch (error) {
                    console.error("Failed to approve project:", error);
                    Swal.fire("ຜິດພາດ", "ບໍ່ສາມາດອະນຸມັດໂຄງການໄດ້.", "error");
                }
            }
        });
    };

    const handleReject = async (projectId) => {
        Swal.fire({
            title: "ທ່ານແນ່ໃຈບໍ່?",
            text: "ທ່ານຕ້ອງການປະຕິເສດໂຄງການນີ້ແທ້ບໍ?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "ແມ່ນ, ປະຕິເສດ!",
            cancelButtonText: "ຍົກເລີກ",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.put(`/projects/reject/${projectId}`);
                    Swal.fire("ສຳເລັດ!", "ໂຄງການຖືກປະຕິເສດແລ້ວ.", "success");
                    fetchData(); // Refresh the list
                } catch (error) {
                    console.error("Failed to reject project:", error);
                    Swal.fire("ຜິດພາດ", "ບໍ່ສາມາດປະຕິເສດໂຄງການໄດ້.", "error");
                }
            }
        });
    };

    const handleViewAttachments = (attachments) => {
        setSelectedAttachments(attachments);
        setModalIsOpen(true);
    };

    const paginatedProjects = filteredProjects.slice((page - 1) * perPage, page * perPage);
    const totalPages = Math.ceil(filteredProjects.length / perPage);

    return (
        <Layout>
            <h1 className="text-3xl font-extrabold text-gray-800 mb-6">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                    📋 ລາຍການຂໍອະນຸມັດໂຄງການ
                </span>
            </h1>

            {/* Filter Section */}
            <div className="bg-white p-6 rounded-xl shadow-md mb-6">
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
                <div className="bg-white p-6 rounded-xl shadow-md overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    #
                                </th>
                                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ຊື່ໂຄງການ
                                </th>
                                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ຮູບພາບ
                                </th>
                                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ບ້ານ
                                </th>
                                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ເມືອງ
                                </th>
                                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ແຂວງ
                                </th>
                                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ຜູ້ປະສານງານ
                                </th>
                                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ສະຖານະ
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedProjects.map((p, index) => (
                                <tr key={p.id} className="hover:bg-gray-50 transition-colors duration-150">
                                    <td className="p-4 whitespace-nowrap text-gray-600">
                                        {(page - 1) * perPage + index + 1}
                                    </td>
                                    <td className="p-4 whitespace-nowrap font-medium text-gray-900">
                                        {p.project_name}
                                    </td>
                                    <td className="p-4 whitespace-nowrap">
                                        {p.image_url ? (
                                            <img
                                                src={`${import.meta.env.VITE_IMAGE_HOST}/${p.image_url}`}
                                                alt={`Image for ${p.project_name}`}
                                                className="h-10 w-10 object-cover rounded-lg"
                                            />
                                        ) : (
                                            <span className="text-gray-400">ບໍ່ມີຮູບ</span>
                                        )}
                                    </td>
                                    <td className="p-4 whitespace-nowrap text-gray-600">{p.village_name}</td>
                                    <td className="p-4 whitespace-nowrap text-gray-600">{p.district_name}</td>
                                    <td className="p-4 whitespace-nowrap text-gray-600">{p.province_name}</td>
                                    <td className="p-4 whitespace-nowrap text-gray-600">
                                        {p.coordinator} ({p.phone})
                                    </td>
                                    <td className="p-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                            {p.p_status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {paginatedProjects.length === 0 && (
                                <tr>
                                    <td colSpan="9" className="p-4 text-center text-gray-500">
                                        ບໍ່ມີລາຍການໂຄງການທີ່ລໍຖ້າອະນຸມັດ.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination Controls */}
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
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${page === i + 1
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
        </Layout>
    );
}