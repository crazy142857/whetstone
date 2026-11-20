// Leak Check: prompts someone is about to paste into a public AI chatbot.
// `[[n|text]]` marks span n; `spans[n]` says what it is. Sensitive kinds are
// secret, personal, confidential and internal (field-guide lessons in
// lib/security/lessons.js) and carry the placeholder a safer prompt would
// use. Kind "safe" spans are look-alikes that are fine to share: flagging
// one counts as a false flag, and the reveal explains why it was fine.
// Every key, name, number and company here is made up; the fake keys
// deliberately don't match real providers' formats.

export const PROMPTS = [
  {
    id: "api-key",
    lesson: "secret",
    title: "Fixing a script",
    code: true,
    text: `My Python script fails with 401 Unauthorized. What's wrong?

import requests
API_KEY = "[[1|pf_live_9Hq2xT7mWv41KcZr0bLs]]"
resp = requests.get("[[2|https://api.payflex.example/v2/balance]]",
    headers={"Authorization": f"Bearer {API_KEY}"})
print(resp.status_code)  # 401`,
    spans: {
      1: { kind: "secret", placeholder: "<API_KEY>", note: "A live API key. Anyone holding it can call the payment API as your company. If this is ever pasted, rotate the key." },
      2: { kind: "safe", note: "The provider's public API address, straight from their documentation. The AI needs it to spot a wrong endpoint." },
    },
  },
  {
    id: "complaint-reply",
    lesson: "personal",
    title: "Polishing a customer reply",
    text: `Rewrite this reply so it sounds warmer:

Dear [[1|Puan Siti Aminah binti Yusof]], regarding your claim under IC [[2|780412-10-5524]], we have reviewed the charge on card [[3|5123 4567 8901 2346]]. As set out in [[4|the refund policy on our website]], refunds take 14 days. Please call [[5|our hotline, 1-300-88-0000]], if you have any questions.`,
    spans: {
      1: { kind: "personal", placeholder: "<CUSTOMER_NAME>", note: "A customer's full name, which ties everything else in the letter to a real person." },
      2: { kind: "personal", placeholder: "<IC_NUMBER>", note: "A MyKad number: it encodes date and place of birth and is used to verify identity. Never needed to reword a letter." },
      3: { kind: "personal", placeholder: "<CARD_NUMBER>", note: "A full card number. Even the last four digits are enough for the AI's purposes." },
      4: { kind: "safe", note: "A public policy, already on the website." },
      5: { kind: "safe", note: "The company's public hotline number, printed on every bill." },
    },
  },
  {
    id: "slow-query",
    lesson: "secret",
    title: "Speeding up a query",
    code: true,
    text: `Why is this query slow? It takes 40 seconds.

-- connecting with [[1|postgres://report_admin:Gr0und!2026@10.20.4.12:5432/sales_prod]]
SELECT c.region, SUM(o.amount)
FROM [[2|orders o JOIN customers c ON c.id = o.customer_id]]
WHERE o.created_at >= '2026-01-01'
GROUP BY c.region;`,
    spans: {
      1: { kind: "secret", placeholder: "postgres://<USER>:<PASSWORD>@<DB_HOST>/<DB_NAME>", note: "A connection string holds the database password, plus the server's internal address and the database name. Three leaks in one line, none of them needed to tune a query." },
      2: { kind: "safe", note: "Table and column names are exactly what the AI needs to suggest an index. They don't grant access to anything." },
    },
  },
  {
    id: "board-notes",
    lesson: "confidential",
    title: "Summarising meeting notes",
    text: `Summarise these notes into three bullet points for my manager:

Q3 revenue came in at [[1|RM 41.2 million, down 18%]], ahead of the results announcement on [[2|28 November]]. Management plans to [[3|close the Penang plant in March]] and is in talks to [[4|acquire Lumio Sdn Bhd]]. The [[5|office will be closed for Deepavali]].`,
    spans: {
      1: { kind: "confidential", placeholder: "<Q3 REVENUE, CHANGE>", note: "Results before they're announced. For a listed company, leaking these can also raise insider-trading problems." },
      2: { kind: "safe", note: "Results dates are normally published in advance." },
      3: { kind: "confidential", placeholder: "<SITE CHANGE>", note: "A closure staff haven't been told about yet." },
      4: { kind: "confidential", placeholder: "<ACQUISITION TARGET>", note: "Deal talks are among the most closely held secrets a company has." },
      5: { kind: "safe", note: "A public holiday." },
    },
  },
  {
    id: "performance-review",
    lesson: "personal",
    title: "Drafting a performance review",
    text: `Help me write a fair performance review for [[1|Daniel Tan]] ([[2|salary RM 9,800]]). He missed two deadlines in June while on [[3|medical leave for depression]]. His [[4|SQL and dashboard work]] is strong and the team relies on him.`,
    spans: {
      1: { kind: "personal", placeholder: "<EMPLOYEE>", note: "The employee's name links everything else here to him." },
      2: { kind: "confidential", placeholder: "<SALARY>", note: "Salary is confidential, and irrelevant to the wording of a review." },
      3: { kind: "personal", placeholder: "<APPROVED LEAVE>", note: "Health information is the most sensitive kind of personal data. \"Approved leave\" is all the AI needs to know." },
      4: { kind: "safe", note: "His skills are the substance of the review; the AI needs them." },
    },
  },
  {
    id: "vlookup",
    lesson: "personal",
    title: "Fixing a spreadsheet formula",
    code: true,
    text: `My VLOOKUP returns #N/A. Sample rows:

[[1|Name, Phone, Email]]
[[2|Lim Wei Ling, 012-345 6789, lim.weiling@gmail.com]]
[[3|Rajesh Kumar, 019-876 5432, rajesh.k88@yahoo.com]]

Formula: [[4|=VLOOKUP(A2, Customers!A:C, 3, FALSE)]]`,
    spans: {
      1: { kind: "safe", note: "Column headers show the structure, which is all the AI needs." },
      2: { kind: "personal", placeholder: "Customer A, 012-000 0000, a@example.com", note: "A real customer's name, mobile number and email. Made-up rows debug a formula just as well." },
      3: { kind: "personal", placeholder: "Customer B, 012-000 0001, b@example.com", note: "Another real customer. Every row you paste is another person's data." },
      4: { kind: "safe", note: "The formula is the thing being fixed." },
    },
  },
  {
    id: "api-log",
    lesson: "secret",
    title: "Debugging a failed request",
    code: true,
    text: `Our app's API call fails. Here's the log:

POST /v1/orders HTTP/1.1
Host: [[1|orders.internal.kestrel.local]]
Authorization: Bearer [[2|eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJvcHMtYm90In0.k3Jd8QwPzR]]
Cookie: [[3|session=8f2c91d0a7be4e55]]
X-Request-Id: [[4|7f3a2b10-ce44-4f1e-9d2a-51c0e0b8a913]]
Response: [[5|403 Forbidden: token expired]]`,
    spans: {
      1: { kind: "internal", placeholder: "<API_HOST>", note: "An internal server name: a map of your network for whoever reads it." },
      2: { kind: "secret", placeholder: "<TOKEN>", note: "An access token. Until it expires (or if this one is refreshed), it lets the holder act as the service." },
      3: { kind: "secret", placeholder: "<SESSION_COOKIE>", note: "A session cookie is a logged-in session. Paste it and someone else can be logged in as you." },
      4: { kind: "safe", note: "A random request id. It only helps match up log lines." },
      5: { kind: "safe", note: "The error is the whole point of the question." },
    },
  },
  {
    id: "supplier-contract",
    lesson: "confidential",
    title: "Summarising a contract",
    text: `Summarise the key terms of this supplier agreement in plain English:

Between [[1|Kestrel Logistics Sdn Bhd]] and the Customer. The Customer receives a [[2|32% discount off list price]] for a minimum of [[3|2,000 pallets a year]]. Either party may end the agreement with [[4|90 days' notice]]. [[5|Governed by the laws of Malaysia]].`,
    spans: {
      1: { kind: "confidential", placeholder: "<SUPPLIER>", note: "Who you have a deal with can itself be confidential, and contracts usually say so. \"The supplier\" summarises just as well." },
      2: { kind: "confidential", placeholder: "<DISCOUNT>", note: "Negotiated pricing: exactly what a competitor would like to know." },
      3: { kind: "confidential", placeholder: "<MINIMUM VOLUME>", note: "Committed volumes reveal the size of the business." },
      4: { kind: "safe", note: "A notice period is standard boilerplate; leaving it in keeps the summary useful." },
      5: { kind: "safe", note: "Standard boilerplate." },
    },
  },
  {
    id: "login-help",
    lesson: "secret",
    title: "Getting help with a login",
    code: true,
    text: `I can't log in to the finance portal. Is my password the problem?

Portal: [[1|https://finance.kestrel.local/login]]
Password: [[2|Harbour@2026!]]
It asked for a code from my phone and I typed [[3|418 223]].
Error: [[4|Invalid credentials. 2 attempts left.]]`,
    spans: {
      1: { kind: "internal", placeholder: "<PORTAL_URL>", note: "An internal address, not reachable from outside, but it tells an attacker what to aim for." },
      2: { kind: "secret", placeholder: "<PASSWORD>", note: "Never paste a password anywhere, to an AI or a person. If you have, change it now." },
      3: { kind: "secret", placeholder: "<CODE>", note: "Even a one-time code is live for a minute or two, and scams ask for exactly this." },
      4: { kind: "safe", note: "The error message is what the AI can actually help with." },
    },
  },
  {
    id: "bucket-copy",
    lesson: "internal",
    title: "Writing an archive script",
    code: true,
    text: `Write a script that copies yesterday's exports to our archive:

Source: [[1|s3://kestrel-payroll-exports-prod]]
Archive: [[2|s3://kestrel-archive-2026]]
Region: [[3|ap-southeast-1]]
Files are named like [[4|export-YYYY-MM-DD.csv]].`,
    spans: {
      1: { kind: "internal", placeholder: "s3://<SOURCE_BUCKET>", note: "A real bucket name, and it announces that it holds payroll. Misconfigured buckets get found by name." },
      2: { kind: "internal", placeholder: "s3://<ARCHIVE_BUCKET>", note: "Another real bucket name. Use placeholders and fill them in when you run the script." },
      3: { kind: "safe", note: "A cloud region code is public and shared by thousands of companies." },
      4: { kind: "safe", note: "The naming pattern is what the script needs to find yesterday's file." },
    },
  },
];
