import React from "react";
import Breadcrumbs from "./Breadcrumbs";
import "./LeftSidebar.css";

export default function LeftSidebar({
                                        categories = [],
                                        selectedCategories = [],
                                        handleCategoryToggle = () => {},
                                        filters = { startDate: "", endDate: "" },
                                        handleFilterChange = () => {},
                                        sortBy = "date",
                                        setSortBy = () => {},
                                        fromProfile = false,
                                        hideBreadcrumbs = false,
                                    }) {
    return (
        <div className="filter-panel">

            {!hideBreadcrumbs && <Breadcrumbs fromProfile={fromProfile} />}

            <h3>Sort posts</h3>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="likes">Likes</option>
                <option value="date">Date</option>
            </select>

            <h3>Categories</h3>
            <div className="category-boxes">
                {categories.length > 0 ? (
                    categories.map(cat => (
                        <div
                            key={`${cat.id ?? cat.title ?? "cat"}-${Math.random()
                                .toString(36)
                                .slice(2, 7)}`}
                            className={`category-box ${
                                selectedCategories.includes(cat.id) ? "active" : ""
                            }`}
                            onClick={() => handleCategoryToggle(cat.id)}
                        >
                            {cat.title}
                        </div>
                    ))
                ) : (
                    <p className="no-categories">No categories</p>
                )}
            </div>

            <h3>Date interval</h3>
            <div className="date-filter">
                <div className="date-field">
                    <label>From:</label>
                    <input
                        type="date"
                        name="startDate"
                        value={filters.startDate}
                        onChange={handleFilterChange}
                    />
                </div>
                <div className="date-field">
                    <label>To:</label>
                    <input
                        type="date"
                        name="endDate"
                        value={filters.endDate}
                        onChange={handleFilterChange}
                    />
                </div>
            </div>
        </div>
    );
}
