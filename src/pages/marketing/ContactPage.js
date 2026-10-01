import React, { useState } from "react";
import { Link } from "react-router-dom";
import SiteChrome from "../../component/marketing/SiteChrome";
import { LOGIN_PATH } from "../../component/marketing/siteContent";

const emptyForm = {
  name: "",
  company: "",
  phone: "",
  message: "",
};

const ContactPage = () => {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const name = form.name.trim();
    const company = form.company.trim();
    const phone = form.phone.replace(/\D/g, "");
    const message = form.message.trim();

    if (!name || !company || !message) {
      setError("Name, company, and message are required.");
      return;
    }
    if (phone.length !== 10) {
      setError("Enter a 10-digit phone number.");
      return;
    }

    const requests = JSON.parse(localStorage.getItem("clothlyn_enquiries") || "[]");
    requests.push({
      name,
      company,
      phone,
      message,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem("clothlyn_enquiries", JSON.stringify(requests));
    setForm(emptyForm);
    setSent(true);
  };

  return (
    <SiteChrome>
      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7D766C]">
            Contact
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Ask for a walkthrough of your unit.
          </h1>
          <p className="mt-4 text-base leading-7 text-[#4C463D]">
            Tell us the company name and what you want to see — lots, scanning,
            salary, or the full floor. If you already have a login, go straight in.
          </p>
          <Link
            to={LOGIN_PATH}
            className="mt-6 inline-flex rounded-full border border-[#C5B396] px-5 py-3 text-sm font-semibold text-[#0B1C30]"
          >
            Login or sign up
          </Link>
        </div>

        <div className="rounded-3xl border border-[#E8DFD4] bg-[#FFFFFF]/80 p-6 sm:p-8">
          {sent ? (
            <div>
              <h2 className="text-2xl font-semibold">Request noted.</h2>
              <p className="mt-3 text-sm leading-6 text-[#4C463D]">
                Your note is saved on this browser only. It is not sent to an
                inbox yet. If you already have a Clothlyn account, open Login.
              </p>
              <button
                type="button"
                className="mt-6 text-sm font-semibold text-[#7D766C]"
                onClick={() => setSent(false)}
              >
                Send another note
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {[
                ["name", "Name", "Your name"],
                ["company", "Company", "Clothing unit name"],
                ["phone", "Phone", "10-digit mobile"],
              ].map(([field, label, placeholder]) => (
                <label key={field} className="block text-sm font-semibold">
                  {label}
                  <input
                    value={form[field]}
                    onChange={update(field)}
                    placeholder={placeholder}
                    inputMode={field === "phone" ? "numeric" : "text"}
                    className="mt-1.5 w-full rounded-xl border border-[#E8DFD4] bg-[#F9F6F1] px-3 py-3 text-sm font-medium outline-none focus:border-[#7D766C]"
                  />
                </label>
              ))}
              <label className="block text-sm font-semibold">
                Message
                <textarea
                  value={form.message}
                  onChange={update("message")}
                  rows={4}
                  placeholder="What should we walk through?"
                  className="mt-1.5 w-full resize-y rounded-xl border border-[#E8DFD4] bg-[#F9F6F1] px-3 py-3 text-sm font-medium outline-none focus:border-[#7D766C]"
                />
              </label>
              {error && <p className="text-sm font-medium text-[#B91C1C]">{error}</p>}
              <button
                type="submit"
                className="w-full rounded-full bg-[#7D766C] py-3 text-sm font-semibold text-[#FFFFFF] hover:bg-[#6A645C]"
              >
                Send request
              </button>
            </form>
          )}
        </div>
      </section>
    </SiteChrome>
  );
};

export default ContactPage;
