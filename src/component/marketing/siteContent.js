export const LOGIN_PATH = "/user/login";

export const navLinks = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export const floorSteps = [
  {
    step: "01",
    title: "Open a lot",
    text: "Start each garment run with the product, design, and quantity the floor will actually make.",
  },
  {
    step: "02",
    title: "Move it through process",
    text: "Cutting, stitching, checking, packing — every station follows the process you set for that unit.",
  },
  {
    step: "03",
    title: "Scan on the floor",
    text: "Workers scan the lot. The office sees where the piece is, without a separate register.",
  },
  {
    step: "04",
    title: "Close pay from the same work",
    text: "Salary, advances, and reports come from the work already recorded. No second spreadsheet.",
  },
];

export const serviceGroups = [
  {
    id: "production",
    kicker: "Production",
    title: "The floor, piece by piece",
    intro:
      "Lots, designs, machines, and scans live in one flow, so a garment does not disappear between tables.",
    items: [
      {
        title: "Lots & products",
        text: "Track each production lot from the moment it is opened until it leaves the floor.",
      },
      {
        title: "Process",
        text: "Define the stations a piece must pass. The floor follows that sequence, not a verbal order.",
      },
      {
        title: "Floor scan",
        text: "QR and barcode scans record who touched the lot and which process just finished.",
      },
      {
        title: "Design master",
        text: "Keep styles and rates together so the same design is not re-entered on every lot.",
      },
      {
        title: "Machines",
        text: "Know which machine is on a job, and scan against the machine the piece actually used.",
      },
    ],
  },
  {
    id: "quality",
    kicker: "Quality",
    title: "Alter, reject, and what is stuck",
    intro:
      "Rework and dead stock stay visible, so they do not hide inside a finished count.",
    items: [
      {
        title: "Alter",
        text: "Count alterations as they happen, instead of discovering them at month end.",
      },
      {
        title: "Alter history",
        text: "See which lots came back, and how often a style needs the same fix.",
      },
      {
        title: "Reject",
        text: "Record rejected pieces separately from good output.",
      },
      {
        title: "Non-moving items",
        text: "Surface lots that have stopped moving before they become forgotten stock.",
      },
    ],
  },
  {
    id: "people",
    kicker: "People & pay",
    title: "Members, salary, and advances",
    intro:
      "The people who made the pieces, and the money owed for that work, stay in the same system.",
    items: [
      {
        title: "Employees & admins",
        text: "Floor members and office admins have their own access. Each role sees only its work.",
      },
      {
        title: "Salary master",
        text: "Set how work is paid, then keep that rule with the person — not in a side file.",
      },
      {
        title: "Salary report & paid",
        text: "Review what is due, then mark what has been paid, from the same records.",
      },
      {
        title: "Upad",
        text: "Record advances against a worker so net pay already accounts for what was given early.",
      },
    ],
  },
  {
    id: "office",
    kicker: "Office",
    title: "Reports across the unit",
    intro:
      "Owners and managers read production and company numbers without asking the floor to rewrite them.",
    items: [
      {
        title: "Product reports",
        text: "See output by product, so a busy style and a slow style are not mixed into one total.",
      },
      {
        title: "Company reports",
        text: "Roll numbers up when more than one company runs on Clothlyn.",
      },
      {
        title: "Companies",
        text: "Each clothing unit keeps its own people, lots, and login. One product, separate books.",
      },
    ],
  },
];
