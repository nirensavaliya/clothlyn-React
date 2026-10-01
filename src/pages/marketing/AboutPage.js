import React from "react";
import { Link } from "react-router-dom";
import SiteChrome from "../../component/marketing/SiteChrome";
import gelaiLogo from "../../assets/login/gelai-infotech-logo.png";

const beliefs = [
  {
    title: "The floor is the source",
    text: "A scan at the table is more reliable than a number typed later in the office.",
  },
  {
    title: "Pay follows the work",
    text: "Salary and advances should come from the lots people actually finished.",
  },
  {
    title: "Each unit stays its own",
    text: "Companies share the product, not each other’s lots, members, or books.",
  },
];

const AboutPage = () => {
  return (
    <SiteChrome>
      <section className="border-b border-[#E8DFD4]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7D766C]">
            About
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight">
            Clothlyn is for the clothing unit that still runs on paper and chat.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#4C463D]">
            A lot moves from cutting to packing. Someone writes it in a book.
            Salary is calculated again at the end of the month. Alter pieces
            get lost between those two books. Clothlyn keeps that path in one
            system: the product, the process, the scan, and the pay.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {beliefs.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-[#E8DFD4] bg-[#FFFFFF]/70 p-6"
            >
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#4C463D]">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-[#E8DFD4] bg-[#EFE7DC]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7D766C]">
              Who builds it
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Powered by Gelai Infotech</h2>
            <p className="mt-3 text-sm leading-6 text-[#4C463D]">
              Gelai Infotech builds and supports Clothlyn for garment factories.
              The login you already use — phone, OTP, client code — is the same
              door this website opens.
            </p>
            <Link
              to="/contact"
              className="mt-6 inline-flex rounded-full bg-[#0B1C30] px-5 py-3 text-sm font-semibold text-[#FFFFFF]"
            >
              Contact the team
            </Link>
          </div>
          <img
            src={gelaiLogo}
            alt="Gelai Infotech"
            className="h-16 w-auto object-contain md:h-20"
          />
        </div>
      </section>
    </SiteChrome>
  );
};

export default AboutPage;
