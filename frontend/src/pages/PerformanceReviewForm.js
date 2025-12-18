import React, { useState } from "react";
import api from "../utils/api";
import { toast } from "react-toastify";

/**
 * Simulating already logged-in user details per prompt.
 * In production you would get this from a context or API.
 */
const currentUser = {
    id: "6923f84e10c68a0668e0229b",
    name: "Amit Kumar",
    email: "amitkumarchiku777@gmail.com",
    role: "lead",
    team: "Development",
    avatar: "",
};

const PERFORMANCE_CATEGORIES = [
    "Work Quality",
    "Task Completion & Productivity",
    "Technical Skills",
    "Communication",
    "Team Collaboration",
    "Problem-Solving",
    "Ownership & Responsibility",
    "Time Management",
    "Learning & Improvement"
];

export default function PerformanceReviewForm() {
    const [step, setStep] = useState(1);

    // Only require review period, date, responsibilities (user details prefilled & non-editable)
    const [formData, setFormData] = useState({
        employeeDetails: { ...currentUser },
        reviewPeriod: "",
        dateOfReview: "",
        responsibilities: [""],
        performance: PERFORMANCE_CATEGORIES.map((cat) => ({
            category: cat,
            rating: "",
            managerComments: "",
        })),
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Validation logic
    const validateSection1 = () => {
        const errs = {};
        if (!formData.reviewPeriod.trim()) errs.reviewPeriod = "Required";
        if (!formData.dateOfReview) errs.dateOfReview = "Required";
        if (
            !formData.responsibilities.length ||
            formData.responsibilities.some((r) => !r.trim())
        )
            errs.responsibilities = "All responsibilities are required";
        return errs;
    };

    const validateSection2 = () => {
        const perfErr = [];
        formData.performance.forEach((item, idx) => {
            if (!item.rating || ![1, 2, 3, 4, 5].includes(Number(item.rating))) {
                perfErr[idx] = "Rating required (1–5)";
            }
        });
        return { performance: perfErr };
    };

    const handleSelectChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
        setErrors((errs) => ({ ...errs, [e.target.name]: undefined }));
    };

    const handleResponsibilityChange = (index, value) => {
        const updated = [...formData.responsibilities];
        updated[index] = value;
        setFormData((prev) => ({ ...prev, responsibilities: updated }));
        setErrors((errs) => ({ ...errs, responsibilities: undefined }));
    };

    const removeResponsibility = (index) => {
        const updated = [...formData.responsibilities];
        updated.splice(index, 1);
        setFormData((prev) => ({ ...prev, responsibilities: updated }));
    };

    const handlePerformanceChange = (index, key, value) => {
        const updated = [...formData.performance];
        updated[index][key] = value;
        setFormData((prev) => ({ ...prev, performance: updated }));
        if (key === "rating") {
            setErrors((errs) => {
                const updateErr = { ...errs };
                if (updateErr.performance) {
                    updateErr.performance[index] = undefined;
                }
                return updateErr;
            });
        }
    };

    const addResponsibility = () => {
        setFormData((prev) => ({
            ...prev,
            responsibilities: [...prev.responsibilities, ""],
        }));
    };

    const handleNext = () => {
        const err = validateSection1();
        setErrors(err);
        if (Object.keys(err).length === 0) setStep(2);
    };

    const handleBack = () => setStep(1);

    const submitForm = async () => {
        const perfErrs = validateSection2();
        let sectionInvalid = false;
        if (perfErrs.performance.some((e) => e)) sectionInvalid = true;
        setErrors(perfErrs);
        if (sectionInvalid) return;

        setLoading(true);
        try {
            await api.post("/api/review/create", formData);
            toast.success("Review submitted successfully!");
            setFormData({
                employeeDetails: { ...currentUser },
                reviewPeriod: "",
                dateOfReview: "",
                responsibilities: [""],
                performance: PERFORMANCE_CATEGORIES.map((cat) => ({
                    category: cat,
                    rating: "",
                    managerComments: "",
                })),
            });
            setStep(1);
        } catch (err) {
            if (err.response && err.response.data && err.response.data.error) {
                toast.error(err.response.data.error);
            } else {
                toast.error("Failed to submit review.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="main-shell auth-shell">
            <div className="main-card auth-card" style={{ maxWidth: 650 }}>
                <h2 className="page-heading" style={{ marginBottom: 22 }}>
                    Performance Review
                </h2>

                {/* Progress Tabs */}
                <div className="multi-step-tabs" style={{ marginBottom: 24, display: "flex" }}>
                    <div
                        className={`tab${step === 1 ? " active" : ""}`}
                        style={{
                            flex: 1,
                            textAlign: "center",
                            padding: "6px 0",
                            borderBottom: step === 1 ? "2px solid #316cc9" : "1px solid #ececec",
                            color: step === 1 ? "#316cc9" : "#AAA",
                            fontWeight: 600,
                            transition: "all 0.13s",
                            fontSize: 15,
                        }}
                    >
                        1. Details
                    </div>
                    <div
                        className={`tab${step === 2 ? " active" : ""}`}
                        style={{
                            flex: 1,
                            textAlign: "center",
                            padding: "6px 0",
                            borderBottom: step === 2 ? "2px solid #316cc9" : "1px solid #ececec",
                            color: step === 2 ? "#316cc9" : "#AAA",
                            fontWeight: 600,
                            transition: "all 0.13s",
                            fontSize: 15,
                        }}
                    >
                        2. Performance
                    </div>
                </div>

                {/* SECTION 1 */}
                {step === 1 && (
                    <form
                        onSubmit={e => { e.preventDefault(); handleNext(); }}
                        style={{ display: "grid", gap: 24 }}
                        autoComplete="off"
                        noValidate
                    >
                        {/* User Info (non-editable) */}
                        <div

                        >
                            <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                <div className="form-group">
                                    <label className="form-label">Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={currentUser.name}
                                        disabled
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={currentUser.email}
                                        disabled
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Role</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={currentUser.role}
                                        disabled
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Team</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={currentUser.team}
                                        disabled
                                    />
                                </div>
                            </div>
                        </div>
                        {/* Review Details */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                            <div className="form-group">
                                <label className="form-label">
                                    Review Period <span style={{ color: "#e33" }}>*</span>
                                </label>
                                <select
                                    name="reviewPeriod"
                                    className="form-input"
                                    style={{ width: "100%" }}
                                    value={formData.reviewPeriod}
                                    onChange={handleSelectChange}
                                >
                                    <option value="">Select Period</option>
                                    <option value="Weekly">Weekly</option>
                                    <option value="Monthly">Monthly</option>
                                    <option value="Quarterly">Quarterly</option>
                                </select>
                                {errors.reviewPeriod && <div className="form-error">{errors.reviewPeriod}</div>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">
                                    Date of Review <span style={{ color: "#e33" }}>*</span>
                                </label>
                                <input
                                    type="date"
                                    name="dateOfReview"
                                    className="form-input"
                                    style={{ width: "100%" }}
                                    value={formData.dateOfReview}
                                    onChange={handleSelectChange}
                                />
                                {errors.dateOfReview && <div className="form-error">{errors.dateOfReview}</div>}
                            </div>
                        </div>
                        {/* Responsibilities */}
                        <div className="form-group">
                            <label className="form-label">
                                Key Responsibilities <span style={{ color: "#e33" }}>*</span>
                            </label>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {formData.responsibilities.map((res, idx) => (
                                    <div key={idx} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                        <input
                                            type="text"
                                            className="form-input"
                                            style={{ flex: 1 }}
                                            placeholder={`Responsibility ${idx + 1}`}
                                            value={res}
                                            onChange={e => handleResponsibilityChange(idx, e.target.value)}
                                        />
                                        {formData.responsibilities.length > 1 && (
                                            <button
                                                type="button"
                                                className="ghost-btn"
                                                onClick={() => removeResponsibility(idx)}
                                                title="Remove responsibility"
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    color: "#d64242",
                                                    fontSize: 18,
                                                    cursor: "pointer",
                                                    padding: 0,
                                                    marginLeft: 2,
                                                }}
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {errors.responsibilities && (
                                <div className="form-error">{errors.responsibilities}</div>
                            )}
                            <button
                                type="button"
                                className="ghost-btn"
                                style={{
                                    marginTop: 6,
                                    color: "#316cc9",
                                    fontSize: 14,
                                    fontWeight: 500,
                                    cursor: "pointer",
                                }}
                                onClick={addResponsibility}
                            >
                                + Add Responsibility
                            </button>
                        </div>
                        <div className="form-group">
                            <button
                                type="submit"
                                className="primary-btn"
                                style={{ width: 160, fontWeight: 600 }}
                            >
                                Next &rarr;
                            </button>
                        </div>
                    </form>
                )}

                {/* SECTION 2 */}
                {step === 2 && (
                    <form
                        onSubmit={e => {
                            e.preventDefault();
                            if (!loading) submitForm();
                        }}
                        style={{ display: "grid", gap: 24 }}
                        noValidate
                    >
                        <div className="form-group">
                            <h3 style={{ margin: 0, fontWeight: 600, color: "#fff", fontSize: "1.15rem" }}>
                                Performance Overview
                            </h3>
                            <div style={{ color: "#fff01", fontSize: 15, marginBottom: 10 }}>
                                Rate each category (1–5, where 5 is best)
                            </div>
                        </div>
                        <div style={{ overflowX: "auto" }}>
                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    fontSize: 15,
                                    boxShadow: "0 0.5px 2.5px #eaeaea",
                                    borderRadius: 7,
                                    overflow: "hidden",
                                }}
                            >
                                <thead>
                                    <tr style={{ background: "#f3f5f8" }}>
                                        <th
                                            style={{
                                                padding: "7px 8px",
                                                textAlign: "left",
                                                fontWeight: 700,
                                                border: "1px solid #e6ecf6",
                                                color: "#15336f",
                                                background: "#f8faff"
                                            }}
                                        >
                                            Category
                                        </th>
                                        <th
                                            style={{
                                                padding: "7px 8px",
                                                textAlign: "left",
                                                fontWeight: 700,
                                                border: "1px solid #e6ecf6",
                                                color: "#15336f",
                                                background: "#f8faff"
                                            }}
                                        >
                                            Rating<span style={{ color: "#e33" }}>*</span>
                                        </th>
                                        <th
                                            style={{
                                                padding: "7px 8px",
                                                textAlign: "left",
                                                fontWeight: 700,
                                                border: "1px solid #e6ecf6",
                                                color: "#15336f",
                                                background: "#f8faff"
                                            }}
                                        >
                                            Manager Comments
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.performance.map((item, idx) => (
                                        <tr key={item.category} style={{ background: idx % 2 === 1 ? "#fafbfc" : "#fff" }}>
                                            <td style={{ padding: "7px 8px", border: "1px solid #e9ecf3",color:"var(--surface-02)" }}>{item.category}</td>
                                            <td style={{ padding: "7px 8px", border: "1px solid #e9ecf3" }}>
                                                <select
                                                    className="form-input"
                                                    style={{ width: 100, fontWeight: 500 }}
                                                    value={item.rating}
                                                    onChange={e => handlePerformanceChange(idx, "rating", e.target.value)}
                                                >
                                                    <option value="">-- Select --</option>
                                                    {[1, 2, 3, 4, 5].map(num => (
                                                        <option key={num} value={num}>{num}</option>
                                                    ))}
                                                </select>
                                                {errors.performance && errors.performance[idx] && (
                                                    <div className="form-error">{errors.performance[idx]}</div>
                                                )}
                                            </td>
                                            <td style={{ padding: "7px 8px", border: "1px solid #e9ecf3" }}>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="Manager's notes"
                                                    value={item.managerComments}
                                                    onChange={e => handlePerformanceChange(idx, "managerComments", e.target.value)}
                                                    style={{ width: "97%" }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ display: "flex", gap: 14, justifyContent: "flex-end" }}>
                            <button
                                type="button"
                                className="ghost-btn"
                                onClick={handleBack}
                                style={{
                                    width: 110,
                                    background: "#f7fafd",
                                    border: "1px solid #e6eeff",
                                    color: "#316cc9",
                                    fontWeight: 500,
                                }}
                            >
                                &larr; Back
                            </button>
                            <button
                                type="submit"
                                className="primary-btn"
                                disabled={loading}
                                style={{
                                    width: 160,
                                    fontWeight: 700,
                                    opacity: loading ? 0.65 : 1,
                                }}
                            >
                                {loading ? "Submitting..." : "Submit Review"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
