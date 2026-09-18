import React, { useMemo, useState } from "react";
import "./DatabaseSchemaPage.css";

const schema = [
  {
    name: "User",
    icon: "👤",
    description:
      "Main user account table. Stores authentication, profile, status, host information, verification, and relationships.",
    fields: [
      { name: "id", type: "UUID", required: true, key: "PK", default: "uuid()" },
      { name: "name", type: "VARCHAR(255)", required: true },
      { name: "email", type: "VARCHAR(255)", required: true, unique: true },
      { name: "password_hash", type: "VARCHAR(255)", required: true },
      { name: "phone_number", type: "VARCHAR(50)", required: true },
      { name: "role", type: "VARCHAR(50)", required: true, default: '"user"' },
      { name: "status", type: "VARCHAR(50)", required: true, default: '"pending"' },
      { name: "status_reason", type: "TEXT", required: false },
      { name: "host_expiry_date", type: "DateTime", required: false },
      {
        name: "email_verified",
        type: "Boolean",
        required: true,
        default: "false",
      },
      {
        name: "email_verification_token",
        type: "VARCHAR(255)",
        required: false,
      },
      {
        name: "email_verification_expires",
        type: "DateTime",
        required: false,
      },
      {
        name: "reset_password_token",
        type: "VARCHAR(255)",
        required: false,
      },
      {
        name: "reset_password_expires",
        type: "DateTime",
        required: false,
      },
      {
        name: "last_active",
        type: "DateTime",
        required: true,
        default: "now()",
      },
      {
        name: "created_at",
        type: "DateTime",
        required: true,
        default: "now()",
      },
      {
        name: "updated_at",
        type: "DateTime",
        required: true,
        default: "now() / @updatedAt",
      },
      {
        name: "host_details",
        type: "JsonB",
        required: true,
        default: "host information JSON",
      },
      {
        name: "user_details",
        type: "JsonB",
        required: true,
        default: "preferences/bookings JSON",
      },
    ],
    relations: [
      "sessions → UserSession[]",
      "events → UserEvent[]",
      "listings → Listing[]",
      "bookings → Booking[]",
      "blocked_users → HostBlockedUser[]",
      "blocked_by → HostBlockedUser[]",
      "id_documents → UserIdDocument[]",
      "reviewed_id_documents → UserIdDocument[]",
      "host_subscription_payments → HostSubscriptionPayment[]",
    ],
    indexes: [
      "email",
      "role",
      "status",
      "email_verified",
    ],
  },

  {
    name: "UserIdDocument",
    icon: "🪪",
    description:
      "Stores identity documents uploaded by users and their verification/review status.",
    fields: [
      { name: "id", type: "UUID", required: true, key: "PK", default: "uuid()" },
      { name: "user_id", type: "UUID", required: true, key: "FK → User.id" },
      {
        name: "document_type",
        type: "VARCHAR(50)",
        required: true,
        default: '"national_id"',
      },
      {
        name: "side",
        type: "VARCHAR(20)",
        required: true,
        default: '"front"',
      },
      { name: "file_url", type: "TEXT", required: true },
      { name: "file_name", type: "VARCHAR(255)", required: false },
      { name: "file_type", type: "VARCHAR(100)", required: false },
      {
        name: "status",
        type: "VARCHAR(20)",
        required: true,
        default: '"pending"',
      },
      { name: "rejection_reason", type: "TEXT", required: false },
      { name: "admin_notes", type: "TEXT", required: false },
      { name: "reviewed_at", type: "DateTime", required: false },
      { name: "reviewed_by", type: "UUID", required: false, key: "FK → User.id" },
      {
        name: "created_at",
        type: "DateTime",
        required: true,
        default: "now()",
      },
      {
        name: "updated_at",
        type: "DateTime",
        required: true,
        default: "now() / @updatedAt",
      },
    ],
    relations: [
      "user → User",
      "reviewer → User?",
    ],
    indexes: [
      "user_id",
      "status",
      "user_id + status",
      "document_type",
      "reviewed_by",
    ],
  },

  {
    name: "UserSession",
    icon: "🔐",
    description:
      "Tracks user login sessions, devices, browsers, operating systems, and IP information.",
    fields: [
      { name: "id", type: "UUID", required: true, key: "PK", default: "uuid()" },
      { name: "user_id", type: "UUID", required: true, key: "FK → User.id" },
      { name: "device", type: "VARCHAR(255)", required: false },
      { name: "browser", type: "VARCHAR(255)", required: false },
      { name: "os", type: "VARCHAR(255)", required: false },
      { name: "ip_address", type: "TEXT", required: false },
      { name: "user_agent", type: "TEXT", required: false },
      {
        name: "logged_in_at",
        type: "DateTime",
        required: true,
        default: "now()",
      },
      { name: "logged_out_at", type: "DateTime", required: false },
      {
        name: "is_active",
        type: "Boolean",
        required: true,
        default: "true",
      },
    ],
    relations: ["user → User"],
    indexes: ["user_id"],
  },

  {
    name: "UserEvent",
    icon: "📋",
    description:
      "Stores user activity/events and optional metadata.",
    fields: [
      { name: "id", type: "UUID", required: true, key: "PK", default: "uuid()" },
      { name: "user_id", type: "UUID", required: true, key: "FK → User.id" },
      { name: "event_type", type: "TEXT", required: false },
      { name: "metadata", type: "JsonB", required: false },
      {
        name: "created_at",
        type: "DateTime",
        required: true,
        default: "now()",
      },
    ],
    relations: ["user → User"],
    indexes: ["user_id"],
  },

  {
    name: "Listing",
    icon: "🏠",
    description:
      "Stores properties/listings created by hosts, including price, location, images, amenities, rules, and availability.",
    fields: [
      { name: "id", type: "UUID", required: true, key: "PK", default: "uuid()" },
      { name: "title", type: "VARCHAR(255)", required: true },
      { name: "description", type: "TEXT", required: true },
      { name: "price", type: "Decimal(10,2)", required: true },
      { name: "location", type: "VARCHAR(255)", required: true },
      { name: "latitude", type: "Decimal(10,8)", required: false },
      { name: "longitude", type: "Decimal(11,8)", required: false },
      {
        name: "images",
        type: "String[]",
        required: true,
        default: "[]",
      },
      {
        name: "category",
        type: "VARCHAR(50)",
        required: true,
        default: '"city"',
      },
      {
        name: "amenities",
        type: "String[]",
        required: true,
        default: "[]",
      },
      { name: "host_id", type: "UUID", required: true, key: "FK → User.id" },
      {
        name: "rules",
        type: "String[]",
        required: true,
        default: "[]",
      },
      {
        name: "cancellation_policy",
        type: "TEXT",
        required: true,
        default: '"flexible"',
      },
      {
        name: "status",
        type: "VARCHAR(20)",
        required: true,
        default: '"active"',
      },
      {
        name: "is_active",
        type: "Boolean",
        required: true,
        default: "true",
      },
      {
        name: "blocked_dates",
        type: "JsonB",
        required: true,
        default: "[]",
      },
      {
        name: "view_count",
        type: "Int",
        required: true,
        default: "0",
      },
      {
        name: "created_at",
        type: "DateTime",
        required: true,
        default: "now()",
      },
      {
        name: "updated_at",
        type: "DateTime",
        required: true,
        default: "now() / @updatedAt",
      },
    ],
    relations: [
      "host → User",
      "bookings → Booking[]",
    ],
    indexes: [
      "host_id",
      "status",
      "category",
    ],
  },

  {
    name: "Booking",
    icon: "📅",
    description:
      "Stores reservations made by users for listings, including dates, guests, price, check-in/out, and status.",
    fields: [
      { name: "id", type: "UUID", required: true, key: "PK", default: "uuid()" },
      {
        name: "listing_id",
        type: "UUID",
        required: true,
        key: "FK → Listing.id",
      },
      { name: "user_id", type: "UUID", required: true, key: "FK → User.id" },
      { name: "check_in", type: "DateTime", required: true },
      { name: "check_out", type: "DateTime", required: true },
      { name: "total_price", type: "Decimal(10,2)", required: true },
      {
        name: "guests",
        type: "Int",
        required: true,
        default: "1",
      },
      { name: "checked_in_at", type: "DateTime", required: false },
      { name: "checked_out_at", type: "DateTime", required: false },
      {
        name: "no_show",
        type: "Boolean",
        required: true,
        default: "false",
      },
      {
        name: "status",
        type: "VARCHAR(20)",
        required: true,
        default: '"pending"',
      },
      {
        name: "created_at",
        type: "DateTime",
        required: true,
        default: "now()",
      },
      {
        name: "updated_at",
        type: "DateTime",
        required: true,
        default: "now() / @updatedAt",
      },
    ],
    relations: [
      "listing → Listing",
      "user → User",
      "blocked_entries → HostBlockedUser[]",
    ],
    indexes: [
      "user_id",
      "listing_id + check_in + check_out",
      "check_in + check_out",
      "status",
    ],
  },

  {
    name: "HostBlockedUser",
    icon: "🚫",
    description:
      "Stores users blocked by hosts, including the reason and optional booking that caused the block.",
    fields: [
      { name: "id", type: "UUID", required: true, key: "PK", default: "uuid()" },
      { name: "host_id", type: "UUID", required: true, key: "FK → User.id" },
      { name: "user_id", type: "UUID", required: true, key: "FK → User.id" },
      { name: "reason", type: "VARCHAR(50)", required: true },
      {
        name: "booking_id",
        type: "UUID",
        required: false,
        key: "FK → Booking.id",
      },
      {
        name: "created_at",
        type: "DateTime",
        required: true,
        default: "now()",
      },
    ],
    relations: [
      "host → User",
      "user → User",
      "booking → Booking?",
    ],
    indexes: [
      "UNIQUE host_id + user_id",
      "host_id",
      "user_id",
    ],
  },

  {
    name: "HostSubscriptionPayment",
    icon: "💳",
    description:
      "Stores host subscription payments, receipts, payment periods, status, references, and notes.",
    fields: [
      { name: "id", type: "UUID", required: true, key: "PK", default: "uuid()" },
      { name: "host_id", type: "UUID", required: true, key: "FK → User.id" },
      { name: "amount", type: "Decimal(10,2)", required: true },
      {
        name: "status",
        type: "VARCHAR(20)",
        required: true,
        default: '"pending"',
      },
      {
        name: "receipt_images",
        type: "String[]",
        required: true,
        default: "[]",
      },
      { name: "paid_at", type: "DateTime", required: false },
      { name: "period_start", type: "DateTime", required: false },
      { name: "period_end", type: "DateTime", required: false },
      { name: "reference", type: "VARCHAR(255)", required: false },
      { name: "notes", type: "TEXT", required: false },
      {
        name: "created_at",
        type: "DateTime",
        required: true,
        default: "now()",
      },
      {
        name: "updated_at",
        type: "DateTime",
        required: true,
        default: "now() / @updatedAt",
      },
    ],
    relations: ["host → User"],
    indexes: [
      "host_id",
      "host_id + status",
      "period_end",
    ],
  },
];

function getTypeClass(type) {
  if (type.includes("UUID")) return "type-uuid";
  if (
    type.includes("VARCHAR") ||
    type.includes("TEXT") ||
    type === "String[]"
  )
    return "type-string";
  if (type.includes("Boolean")) return "type-boolean";
  if (type.includes("Int") || type.includes("Decimal"))
    return "type-number";
  if (type.includes("DateTime")) return "type-date";
  if (type.includes("Json")) return "type-json";

  return "";
}

export default function DatabaseSchemaPage() {
  const [selectedTable, setSelectedTable] = useState("User");
  const [search, setSearch] = useState("");
  const [showRelations, setShowRelations] = useState(true);

  const currentTable = schema.find(
    (table) => table.name === selectedTable
  );

  const filteredTables = useMemo(() => {
    if (!search.trim()) return schema;

    const value = search.toLowerCase();

    return schema.filter(
      (table) =>
        table.name.toLowerCase().includes(value) ||
        table.description.toLowerCase().includes(value) ||
        table.fields.some((field) =>
          field.name.toLowerCase().includes(value)
        )
    );
  }, [search]);

  const totalFields = schema.reduce(
    (total, table) => total + table.fields.length,
    0
  );

  return (
    <div className="schema-page">
      <div className="schema-header">
        <div>
          <div className="eyebrow">DATABASE</div>

          <h1>Database Schema</h1>

          <p>
            Explore the structure of your Marhaba database,
            tables, fields, relationships and indexes.
          </p>
        </div>

        <div className="schema-header-badge">
          <span className="status-dot" />
          Prisma PostgreSQL
        </div>
      </div>

      <div className="schema-stats">
        <div className="stat-card">
          <div className="stat-icon">▦</div>
          <div>
            <strong>{schema.length}</strong>
            <span>Tables</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">◫</div>
          <div>
            <strong>{totalFields}</strong>
            <span>Total Fields</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">↔</div>
          <div>
            <strong>
              {schema.reduce(
                (total, table) =>
                  total + (table.relations?.length || 0),
                0
              )}
            </strong>
            <span>Relations</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⌁</div>
          <div>
            <strong>
              {schema.reduce(
                (total, table) =>
                  total + (table.indexes?.length || 0),
                0
              )}
            </strong>
            <span>Indexes</span>
          </div>
        </div>
      </div>

      <div className="schema-layout">
        <aside className="schema-sidebar">
          <div className="sidebar-title">TABLES</div>

          <div className="schema-search">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search tables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="table-list">
            {filteredTables.map((table) => (
              <button
                key={table.name}
                className={`table-button ${
                  selectedTable === table.name
                    ? "active"
                    : ""
                }`}
                onClick={() => setSelectedTable(table.name)}
              >
                <span className="table-icon">
                  {table.icon}
                </span>

                <span className="table-button-content">
                  <strong>{table.name}</strong>

                  <small>
                    {table.fields.length} fields
                  </small>
                </span>

                {selectedTable === table.name && (
                  <span className="selected-arrow">›</span>
                )}
              </button>
            ))}

            {filteredTables.length === 0 && (
              <div className="no-results">
                No tables found.
              </div>
            )}
          </div>
        </aside>

        <main className="schema-content">
          {currentTable && (
            <>
              <div className="table-heading">
                <div className="table-title-wrapper">
                  <div className="large-table-icon">
                    {currentTable.icon}
                  </div>

                  <div>
                    <h2>{currentTable.name}</h2>

                    <p>
                      {currentTable.description}
                    </p>
                  </div>
                </div>

                <div className="field-count">
                  {currentTable.fields.length} fields
                </div>
              </div>

              <div className="section-card">
                <div className="section-header">
                  <div>
                    <h3>Fields</h3>
                    <span>
                      Columns stored in this table
                    </span>
                  </div>
                </div>

                <div className="fields-table-wrapper">
                  <table className="fields-table">
                    <thead>
                      <tr>
                        <th>FIELD</th>
                        <th>TYPE</th>
                        <th>REQUIRED</th>
                        <th>KEY</th>
                        <th>DEFAULT</th>
                      </tr>
                    </thead>

                    <tbody>
                      {currentTable.fields.map(
                        (field) => (
                          <tr key={field.name}>
                            <td>
                              <div className="field-name">
                                {field.key === "PK" && (
                                  <span className="key-icon">
                                    🔑
                                  </span>
                                )}

                                {field.name}
                              </div>
                            </td>

                            <td>
                              <span
                                className={`type-badge ${getTypeClass(
                                  field.type
                                )}`}
                              >
                                {field.type}
                              </span>
                            </td>

                            <td>
                              {field.required ? (
                                <span className="required">
                                  Required
                                </span>
                              ) : (
                                <span className="optional">
                                  Optional
                                </span>
                              )}
                            </td>

                            <td>
                              {field.key ? (
                                <span className="key-badge">
                                  {field.key}
                                </span>
                              ) : (
                                <span className="empty">
                                  —
                                </span>
                              )}
                            </td>

                            <td>
                              {field.default ? (
                                <code>
                                  {field.default}
                                </code>
                              ) : (
                                <span className="empty">
                                  —
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bottom-grid">
                <div className="section-card">
                  <div className="section-header">
                    <div>
                      <h3>Relationships</h3>
                      <span>
                        Connected tables and models
                      </span>
                    </div>

                    <button
                      className="small-toggle"
                      onClick={() =>
                        setShowRelations(!showRelations)
                      }
                    >
                      {showRelations
                        ? "Hide"
                        : "Show"}
                    </button>
                  </div>

                  {showRelations && (
                    <div className="relation-list">
                      {currentTable.relations?.map(
                        (relation) => (
                          <div
                            className="relation-item"
                            key={relation}
                          >
                            <span className="relation-icon">
                              ↔
                            </span>

                            <span>{relation}</span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                <div className="section-card">
                  <div className="section-header">
                    <div>
                      <h3>Indexes</h3>
                      <span>
                        Database indexes
                      </span>
                    </div>
                  </div>

                  <div className="index-list">
                    {currentTable.indexes?.map(
                      (index) => (
                        <div
                          className="index-item"
                          key={index}
                        >
                          <span className="index-icon">
                            #
                          </span>

                          <code>{index}</code>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}