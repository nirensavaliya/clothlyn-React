import React from "react";
import { Link } from "react-router-dom";
import SiteChrome from "../../component/marketing/SiteChrome";
import { LOGIN_PATH, serviceGroups } from "../../component/marketing/siteContent";

const ServicesPage = () => {
  return (
    <SiteChrome>
      <section className="border-b border-[#E8DFD4]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7D766C]">
            Services
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight">
            Everything a clothing unit already does — recorded once.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#4C463D]">
            These are the working parts of Clothlyn: production, quality,
            people, and the reports the office reads at the end of the day.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-4 py-16 sm:px-6">
        {serviceGroups.map((group) => (
          <section key={group.id} id={group.id}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C5B396]">
              {group.kicker}
            </p>
            <h2 className="mt-2 text-2xl font-semibold">{group.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#4C463D]">{group.intro}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {group.items.map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-[#E8DFD4] bg-[#FFFFFF]/60 p-5"
                >
                  <h3 className="text-base font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#4C463D]">{item.text}</p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="border-t border-[#E8DFD4] bg-[#EFE7DC]">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-12 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="text-2xl font-semibold">Ready to open the workspace?</h2>
            <p className="mt-2 text-sm text-[#4C463D]">
              Login and Sign up use the current Clothlyn login page.
            </p>
          </div>
          <Link
            to={LOGIN_PATH}
            className="rounded-full bg-[#7D766C] px-5 py-3 text-sm font-semibold text-[#FFFFFF] hover:bg-[#6A645C]"
          >
            Login
          </Link>
        </div>
      </section>
    </SiteChrome>
  );
};

export default ServicesPage;
