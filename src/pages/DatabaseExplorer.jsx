
import React, { useEffect, useMemo, useState } from "react";
import "./DatabaseExplorer.css";
import { authFetch } from "../utils/auth";

const API_URL = import.meta.env.VITE_API_URL || "";

const tableInfo = {
  User: {
    icon: "👤",
    description: "Users, authentication, roles and host information",
  },
  UserIdDocument: {
    icon: "🪪",
    description: "User identity documents and verification",
  },
  UserSession: {
    icon: "🔐",
    description: "Login sessions and device information",
  },
  UserEvent: {
    icon: "📋",
    description: "User activity and events",
  },
  Listing: {
    icon: "🏠",
    description: "Property listings",
  },
  Booking: {
    icon: "📅",
    description: "Property reservations",
  },
  HostBlockedUser: {
    icon: "🚫",
    description: "Users blocked by hosts",
  },
  HostSubscriptionPayment: {
    icon: "💳",
    description: "Host subscription payments and receipts",
  },
};

function formatValue(value) {
  if (value === null || value === undefined) {
    return <span className="null-value">NULL</span>;
  }

  if (typeof value === "boolean") {
    return (
      <span
        className={`boolean-value ${
          value ? "true" : "false"
        }`}
      >
        {value ? "true" : "false"}
      </span>
    );
  }

  if (Array.isArray(value)) {
    return (
      <span
        className="array-value"
        title={JSON.stringify(value, null, 2)}
      >
        {value.length} items
      </span>
    );
  }

  if (typeof value === "object") {
    return (
      <pre className="json-value">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  if (typeof value === "string" && value.length > 100) {
    return (
      <span title={value}>
        {value.substring(0, 100)}...
      </span>
    );
  }

  return String(value);
}

export default function DatabaseExplorer() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState("User");

  const [rows, setRows] = useState([]);

  const [loadingTables, setLoadingTables] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [rowSearch, setRowSearch] = useState("");

  const [selectedRow, setSelectedRow] = useState(null);

  /*
   * Load database overview when page opens
   */
  useEffect(() => {
    loadOverview();
  }, []);

  /*
   * Load selected table whenever selection changes
   */
  useEffect(() => {
    if (selectedTable) {
      loadTable(selectedTable);
    }
  }, [selectedTable]);

  /*
   * Load database tables
   */
  async function loadOverview() {
    try {
      setLoadingTables(true);
      setError("");

      const response = await authFetch(
        `${API_URL}/api/v1/database/overview`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to load database"
        );
      }

      setTables(result.data?.tables || []);
    } catch (err) {
      console.error("Database overview error:", err);

      setError(
        err.message || "Failed to load database"
      );
    } finally {
      setLoadingTables(false);
    }
  }

  /*
   * Load actual records from selected table
   */
  async function loadTable(table) {
    try {
      setLoadingRows(true);
      setError("");
      setSelectedRow(null);

      const response = await authFetch(
        `${API_URL}/api/v1/database/table/${encodeURIComponent(
          table
        )}`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to load table"
        );
      }

      setRows(result.data || []);
    } catch (err) {
      console.error(
        `Database table ${table} error:`,
        err
      );

      setError(
        err.message || "Failed to load table"
      );

      setRows([]);
    } finally {
      setLoadingRows(false);
    }
  }

  /*
   * Refresh everything
   */
  async function handleRefresh() {
    setError("");

    await loadOverview();
    await loadTable(selectedTable);
  }

  /*
   * Filter tables
   */
  const filteredTables = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) {
      return tables;
    }

    return tables.filter((table) =>
      table.name.toLowerCase().includes(value)
    );
  }, [tables, search]);

  /*
   * Filter records
   */
  const filteredRows = useMemo(() => {
    if (!rowSearch.trim()) {
      return rows;
    }

    const searchValue = rowSearch.toLowerCase().trim();

    return rows.filter((row) =>
      Object.values(row).some((value) =>
        JSON.stringify(value)
          .toLowerCase()
          .includes(searchValue)
      )
    );
  }, [rows, rowSearch]);

  /*
   * Get all columns dynamically
   *
   * Different records can have different JSON
   * values, so we combine all keys.
   */
  const columns = useMemo(() => {
    if (!rows.length) {
      return [];
    }

    const keys = new Set();

    rows.forEach((row) => {
      Object.keys(row).forEach((key) => {
        keys.add(key);
      });
    });

    return Array.from(keys);
  }, [rows]);

  const currentInfo = tableInfo[selectedTable];

  return (
    <div className="database-page">
      {/* =========================================
          HEADER
      ========================================== */}
      <div className="database-header">
        <div>
          <div className="database-eyebrow">
            ADMIN DATABASE
          </div>

          <h1>Database Explorer</h1>

          <p>
            View your Prisma database tables and the
            actual records stored inside them.
          </p>
        </div>

        <button
          className="refresh-button"
          onClick={handleRefresh}
          disabled={loadingTables || loadingRows}
        >
          ↻{" "}
          {loadingTables || loadingRows
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {/* =========================================
          ERROR
      ========================================== */}
      {error && (
        <div className="database-error">
          <strong>Database error</strong>

          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}

      {/* =========================================
          DATABASE LAYOUT
      ========================================== */}
      <div className="database-layout">
        {/* =======================================
            SIDEBAR
        ======================================== */}
        <aside className="database-sidebar">
          <div className="sidebar-heading">
            <span>TABLES</span>

            <strong>{tables.length}</strong>
          </div>

          {/* Table search */}
          <div className="database-search">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search tables..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

          {/* Table list */}
          <div className="database-table-list">
            {loadingTables ? (
              <div className="loading">
                Loading tables...
              </div>
            ) : filteredTables.length === 0 ? (
              <div className="loading">
                No tables found.
              </div>
            ) : (
              filteredTables.map((table) => {
                const info =
                  tableInfo[table.name] || {};

                return (
                  <button
                    key={table.name}
                    type="button"
                    className={`database-table-button ${
                      selectedTable === table.name
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedTable(table.name)
                    }
                  >
                    <span className="database-table-icon">
                      {info.icon || "▦"}
                    </span>

                    <span className="database-table-info">
                      <strong>{table.name}</strong>

                      <small>
                        {table.count ?? 0} records
                      </small>
                    </span>

                    <span className="database-arrow">
                      ›
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* =======================================
            MAIN CONTENT
        ======================================== */}
        <main className="database-main">
          {/* Selected table header */}
          <div className="selected-table-header">
            <div className="selected-table-title">
              <div className="selected-table-icon">
                {currentInfo?.icon || "▦"}
              </div>

              <div>
                <h2>{selectedTable}</h2>

                <p>
                  {currentInfo?.description ||
                    "Database table"}
                </p>
              </div>
            </div>

            <div className="record-count">
              {rows.length} records
            </div>
          </div>

          {/* =====================================
              ROW SEARCH
          ====================================== */}
          <div className="data-toolbar">
            <div className="row-search">
              <span>⌕</span>

              <input
                type="text"
                placeholder={`Search ${selectedTable}...`}
                value={rowSearch}
                onChange={(e) =>
                  setRowSearch(e.target.value)
                }
              />
            </div>

            <div className="toolbar-info">
              Showing{" "}
              <strong>
                {filteredRows.length}
              </strong>{" "}
              of{" "}
              <strong>{rows.length}</strong>
            </div>
          </div>

          {/* =====================================
              DATA TABLE
          ====================================== */}
          <div className="data-card">
            {loadingRows ? (
              <div className="loading-data">
                <div className="spinner" />

                <span>
                  Loading {selectedTable}...
                </span>
              </div>
            ) : rows.length === 0 ? (
              <div className="empty-data">
                <div className="empty-icon">
                  ▦
                </div>

                <h3>No data found</h3>

                <p>
                  This table doesn't contain any
                  records.
                </p>
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="empty-data">
                <div className="empty-icon">
                  ⌕
                </div>

                <h3>No matching records</h3>

                <p>
                  No records match "{rowSearch}".
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setRowSearch("")
                  }
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      {columns.map((column) => (
                        <th key={column}>
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRows.map(
                      (row, index) => (
                        <tr
                          key={
                            row.id ||
                            `${selectedTable}-${index}`
                          }
                          onClick={() =>
                            setSelectedRow(row)
                          }
                        >
                          {columns.map(
                            (column) => (
                              <td
                                key={column}
                              >
                                {formatValue(
                                  row[column]
                                )}
                              </td>
                            )
                          )}
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* =========================================
          ROW DETAILS MODAL
      ========================================== */}
      {selectedRow && (
        <div
          className="details-overlay"
          onClick={() =>
            setSelectedRow(null)
          }
        >
          <div
            className="details-panel"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            {/* Header */}
            <div className="details-header">
              <div>
                <span>RECORD DETAILS</span>

                <h2>{selectedTable}</h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedRow(null)
                }
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="details-body">
              {Object.entries(selectedRow).map(
                ([key, value]) => (
                  <div
                    className="detail-field"
                    key={key}
                  >
                    <label>{key}</label>

                    <div>
                      {formatValue(value)}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
