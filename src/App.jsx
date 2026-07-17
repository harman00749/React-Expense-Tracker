import { useEffect, useMemo, useState } from "react";
import "./App.css";

const STORAGE_KEY = "freelancer-expense-tracker:expenses:v2";
const initialFormState = {
  title: "",
  amount: "",
  category: "",
  date: "",
  note: "",
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const categoryOptions = ["Travel", "Software", "Office", "Meals", "Internet", "Other"];

function sanitizeText(value) {
  const entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "`": "&#x60;",
  };

  return String(value)
    .replace(/[&<>"'`]/g, (character) => entityMap[character])
    .trim();
}

function logAnalytics(action) {
  console.log(`[Analytics] User interacted with React Expense Tracker: ${action}`);
}

function readStoredExpenses() {
  try {
    const storedExpenses = window.localStorage.getItem(STORAGE_KEY);
    const parsedExpenses = storedExpenses ? JSON.parse(storedExpenses) : [];
    return Array.isArray(parsedExpenses) ? parsedExpenses : [];
  } catch (error) {
    console.warn("Expense storage could not be read. Empty state loaded.", error);
    return [];
  }
}

function writeStoredExpenses(expenses) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch (error) {
    console.warn("Expense storage could not be updated.", error);
  }
}

function validateExpense(formData) {
  const errors = {};
  const normalizedAmount = Number(formData.amount);

  if (!formData.title.trim()) {
    errors.title = "Title is required.";
  }

  if (!formData.amount || Number.isNaN(normalizedAmount) || normalizedAmount <= 0) {
    errors.amount = "Enter a valid amount above zero.";
  }

  if (!formData.category) {
    errors.category = "Category is required.";
  }

  if (!formData.date) {
    errors.date = "Date is required.";
  }

  return errors;
}

function App() {
  const [expenses, setExpenses] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isBooting, setIsBooting] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const bootTimer = window.setTimeout(() => {
      setExpenses(readStoredExpenses());
      setIsBooting(false);
    }, 700);

    return () => window.clearTimeout(bootTimer);
  }, []);

  useEffect(() => {
    if (!isBooting) {
      writeStoredExpenses(expenses);
    }
  }, [expenses, isBooting]);

  const filteredExpenses = useMemo(() => {
    const query = sanitizeText(searchTerm).toLowerCase();

    return expenses.filter((expense) => {
      const matchesSearch =
        expense.title.toLowerCase().includes(query) ||
        expense.category.toLowerCase().includes(query) ||
        expense.note.toLowerCase().includes(query);
      const matchesCategory =
        categoryFilter === "All" || expense.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchTerm, categoryFilter]);

  const totals = useMemo(() => {
    const totalAmount = filteredExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    );
    const highestExpense = filteredExpenses.reduce(
      (highest, expense) => Math.max(highest, expense.amount),
      0,
    );

    return {
      count: filteredExpenses.length,
      totalAmount,
      averageAmount: filteredExpenses.length ? totalAmount / filteredExpenses.length : 0,
      highestExpense,
    };
  }, [filteredExpenses]);

  function updateFormField(field, value) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [field]: value,
    }));

    if (formErrors[field]) {
      setFormErrors((currentErrors) => ({
        ...currentErrors,
        [field]: "",
      }));
    }
  }

  function addExpense(event) {
    event.preventDefault();

    const validationErrors = validateExpense(formData);
    setFormErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSaving(true);

    window.setTimeout(() => {
      const expense = {
        id: window.crypto?.randomUUID?.() || `expense-${Date.now()}`,
        title: sanitizeText(formData.title),
        amount: Number(formData.amount),
        category: sanitizeText(formData.category),
        date: formData.date,
        note: sanitizeText(formData.note),
        createdAt: new Date().toISOString(),
      };

      setExpenses((currentExpenses) => [expense, ...currentExpenses]);
      setFormData(initialFormState);
      setFormErrors({});
      setIsSaving(false);
      logAnalytics("expense_created");
    }, 500);
  }

  function deleteExpense(expenseId) {
    setExpenses((currentExpenses) =>
      currentExpenses.filter((expense) => expense.id !== expenseId),
    );
    logAnalytics("expense_deleted");
  }

  function clearFilters() {
    setSearchTerm("");
    setCategoryFilter("All");
    logAnalytics("filters_cleared");
  }

  if (isBooting) {
    return <LoadingScreen />;
  }

  return (
    <main className="app-shell">
      <Header />
      <section className="workspace" aria-label="React Expense Tracker workspace">
        <ExpenseForm
          formData={formData}
          formErrors={formErrors}
          isSaving={isSaving}
          onFieldChange={updateFormField}
          onSubmit={addExpense}
        />
        <div className="expense-board">
          <SummaryPanel totals={totals} />
          <ExpenseToolbar
            searchTerm={searchTerm}
            categoryFilter={categoryFilter}
            onSearchChange={setSearchTerm}
            onCategoryChange={setCategoryFilter}
            onClearFilters={clearFilters}
          />
          <ExpenseList expenses={filteredExpenses} onDeleteExpense={deleteExpense} />
        </div>
      </section>
    </main>
  );
}

function Header() {
  return (
    <header className="header">
      <div>
        <p className="eyebrow">Freelancer Expense Module</p>
        <h1>React Expense Tracker</h1>
      </div>
      <p className="status-pill" aria-label="Application status">
        Local storage enabled
      </p>
    </header>
  );
}

function LoadingScreen() {
  return (
    <main className="loading-screen" aria-live="polite" aria-busy="true">
      <div className="spinner" aria-hidden="true" />
      <p>Loading expense workspace</p>
    </main>
  );
}

function ExpenseForm({ formData, formErrors, isSaving, onFieldChange, onSubmit }) {
  return (
    <form className="expense-form" onSubmit={onSubmit} noValidate>
      <div className="section-heading">
        <p className="eyebrow">New expense</p>
        <h2>Add record</h2>
      </div>

      <FormField
        id="expense-title"
        label="Title"
        error={formErrors.title}
        isRequired
      >
        <input
          id="expense-title"
          type="text"
          value={formData.title}
          onChange={(event) => onFieldChange("title", event.target.value)}
          aria-invalid={Boolean(formErrors.title)}
          aria-describedby={formErrors.title ? "expense-title-error" : undefined}
          autoComplete="off"
        />
      </FormField>

      <FormField
        id="expense-amount"
        label="Amount"
        error={formErrors.amount}
        isRequired
      >
        <input
          id="expense-amount"
          type="number"
          min="0"
          step="1"
          value={formData.amount}
          onChange={(event) => onFieldChange("amount", event.target.value)}
          aria-invalid={Boolean(formErrors.amount)}
          aria-describedby={formErrors.amount ? "expense-amount-error" : undefined}
        />
      </FormField>

      <FormField
        id="expense-category"
        label="Category"
        error={formErrors.category}
        isRequired
      >
        <select
          id="expense-category"
          value={formData.category}
          onChange={(event) => onFieldChange("category", event.target.value)}
          aria-invalid={Boolean(formErrors.category)}
          aria-describedby={formErrors.category ? "expense-category-error" : undefined}
        >
          <option value="">Select category</option>
          {categoryOptions.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </FormField>

      <FormField id="expense-date" label="Date" error={formErrors.date} isRequired>
        <input
          id="expense-date"
          type="date"
          value={formData.date}
          onChange={(event) => onFieldChange("date", event.target.value)}
          aria-invalid={Boolean(formErrors.date)}
          aria-describedby={formErrors.date ? "expense-date-error" : undefined}
        />
      </FormField>

      <FormField id="expense-note" label="Notes">
        <textarea
          id="expense-note"
          rows="4"
          value={formData.note}
          onChange={(event) => onFieldChange("note", event.target.value)}
        />
      </FormField>

      <button className="primary-button" type="submit" aria-label="Add expense record">
        {isSaving ? "Saving..." : "Add expense"}
      </button>
    </form>
  );
}

function FormField({ id, label, error, isRequired = false, children }) {
  return (
    <div className={`field ${error ? "field-error" : ""}`}>
      <label htmlFor={id}>
        {label}
        {isRequired ? <span aria-hidden="true">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="error-text" id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SummaryPanel({ totals }) {
  const summaryItems = [
    ["Records", totals.count],
    ["Total", currencyFormatter.format(totals.totalAmount)],
    ["Average", currencyFormatter.format(totals.averageAmount)],
    ["Highest", currencyFormatter.format(totals.highestExpense)],
  ];

  return (
    <section className="summary-grid" aria-label="Expense summary">
      {summaryItems.map(([label, value]) => (
        <article className="metric" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </article>
      ))}
    </section>
  );
}

function ExpenseToolbar({
  searchTerm,
  categoryFilter,
  onSearchChange,
  onCategoryChange,
  onClearFilters,
}) {
  return (
    <section className="toolbar" aria-label="Expense filters">
      <div className="field compact-field">
        <label htmlFor="expense-search">Search</label>
        <input
          id="expense-search"
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label="Search expenses"
        />
      </div>
      <div className="field compact-field">
        <label htmlFor="category-filter">Filter</label>
        <select
          id="category-filter"
          value={categoryFilter}
          onChange={(event) => onCategoryChange(event.target.value)}
          aria-label="Filter expenses by category"
        >
          <option value="All">All categories</option>
          {categoryOptions.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      <button
        className="secondary-button"
        type="button"
        onClick={onClearFilters}
        aria-label="Clear expense filters"
      >
        Clear
      </button>
    </section>
  );
}

function ExpenseList({ expenses, onDeleteExpense }) {
  if (expenses.length === 0) {
    return (
      <section className="empty-state" aria-live="polite">
        <h2>No data found</h2>
      </section>
    );
  }

  return (
    <section className="table-wrap" aria-label="Expense records">
      <table>
        <caption>Freelancer expenses</caption>
        <thead>
          <tr>
            <th scope="col">Title</th>
            <th scope="col">Category</th>
            <th scope="col">Date</th>
            <th scope="col">Amount</th>
            <th scope="col">Notes</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id}>
              <td>{expense.title}</td>
              <td>{expense.category}</td>
              <td>{expense.date}</td>
              <td>{currencyFormatter.format(expense.amount)}</td>
              <td>{expense.note || "None"}</td>
              <td>
                <button
                  className="text-button"
                  type="button"
                  onClick={() => onDeleteExpense(expense.id)}
                  aria-label={`Delete ${expense.title}`}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default App;
