import React, { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import "./mention.css";

export default function WYSIWYGEditor() {
  const editorRef = useRef(null);
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [suggestionPosition, setSuggestionPosition] = useState({ x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [savedRange, setSavedRange] = useState(null);
  const [atSignRange, setAtSignRange] = useState(null); // Store the @ character range specifically
  const [highlightIndex, setHighlightIndex] = useState(0);
  const itemRefs = useRef([]);
  const suggestionRef = useRef(null);
  const [value,setValue] = useState("test demo @@Mapped Product@@ test 13333 @@Division@@ 123");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (suggestionOpen) {
      setHighlightIndex(0);
      // setTimeout(() => {
      //   const firstItem = document.querySelector(".suggestion-item");
      //   if (firstItem) {
      //     firstItem.focus();
      //   }
      // }, 0); // slight delay ensures DOM is painted
    }
    function handleClickOutside(event) {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(event.target)
      ) {
        setSuggestionOpen(false);
      }
    }

    if (suggestionOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }


    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [suggestionOpen]);

  useEffect(() => {
    console.log("Value changed:", isInitialized);
    if (editorRef.current && !isInitialized) {
      editorRef.current.innerHTML = convertPlainToEditorContent(value);
      
      // Set cursor to end after content is set
      setTimeout(() => {
        setCursorToEnd();
        setIsInitialized(true);
      }, 0);
    }
  }, [isInitialized]);

  useEffect(() => {
    if (suggestionOpen && itemRefs.current[highlightIndex]) {
      itemRefs.current[highlightIndex].scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [highlightIndex, suggestionOpen]);

  const handleKeyDown = (e) => {
    if (e.key === "@") {
      // Let the @ character be inserted first
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Create a range that includes the @ character
        const atRange = range.cloneRange();
        atRange.setStart(range.startContainer, range.startOffset - 1);
        atRange.setEnd(range.startContainer, range.startOffset);

        setAtSignRange(atRange);
        setSavedRange(range.cloneRange());
        setSuggestionOpen(true);
        setSuggestionPosition({
          x: rect.left,
          y: rect.bottom + window.scrollY,
        });
        setSearchTerm(""); // Reset search term
      }, 0);
    } else if (e.key === "Escape") {
      setSuggestionOpen(false);
    } else if (e.key === "ArrowDown" && suggestionOpen) {
      console.log("Arrow Down");
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % filteredFields.length);
    } else if (e.key === "ArrowUp" && suggestionOpen) {
      e.preventDefault();
      setHighlightIndex(
        (prev) => (prev - 1 + filteredFields.length) % filteredFields.length
      );
    } else if (e.key === "Enter" && suggestionOpen) {
      e.preventDefault();
      if (filteredFields[highlightIndex]) {
        insertField(filteredFields[highlightIndex]);
        setSuggestionOpen(false);
        setValue((pre) => pre + "@@"+filteredFields[highlightIndex].displayName+"@@");
      }
    }
  };

  const fields = [
    {
      id: "28f007bd-16fd-473c-9bfa-c16a223889a7",
      fieldName: "adjustmentType",
      type: "CC",
      displayName: "Adjustment Type",
      description:
        "adjustmentType field representing text. Free text field with no special formatting requirements.",
      displayOrder: null,
    },
    {
      id: "e52a4efb-102d-44a8-9838-1304a2a6f426",
      fieldName: "agencyID",
      type: "CC",
      displayName: "Agency ID",
      description:
        "Carrier assigned ID for the agency of the policy. The producer typical represents the agency or places the business thru the agency. Free text field with no special formatting requirements.",
      displayOrder: "60",
    },
    {
      id: "066a2023-d1ae-4954-8e36-92785e66fe2e",
      fieldName: "agencyName",
      type: "CC",
      displayName: "Agency Name",
      description:
        "Name of the agency Free text field with no special formatting requirements.",
      displayOrder: "80",
    },
    {
      id: "ecf3be9c-162f-4718-a797-130f2d5b7885",
      fieldName: "AMS-Division",
      type: "CC",
      displayName: "Division",
      description:
        "AMS-Division field representing text. Free text field with no special formatting requirements.",
      displayOrder: "115",
    },
    {
      id: "dd20c572-9dd0-49c5-bc9d-d5ba039b5e42",
      fieldName: "AMS-Payor-Carrier",
      type: "CC",
      displayName: "Mapped Payor",
      description:
        "This is the carrier name the agency needs to see in their agency management system for commission processing Free text field with no special formatting requirements.",
      displayOrder: "92",
    },
    {
      id: "cfce3b7e-cbb8-486f-8756-635180cf8568",
      fieldName: "AMS-Producer-Agent",
      type: "CC",
      displayName: "Mapped Producer",
      description:
        "This is the agency name the agency needs to see in their agency management system for commission processing Free text field with no special formatting requirements.",
      displayOrder: "90",
    },
    {
      id: "e7c89b9d-110e-438c-bcce-9a10d21717ee",
      fieldName: "AMS-Product",
      type: "CC",
      displayName: "Mapped Product",
      description:
        "This is the product name the agency needs to see in their agency management system for commission processing Free text field with no special formatting requirements.",
      displayOrder: "94",
    },
    {
      id: "25028b98-79d5-459b-a7ff-286a89f33c11",
      fieldName: "audit",
      type: "CC",
      displayName: "Audit",
      description: null,
      displayOrder: null,
    },
    {
      id: "a76e848e-d2eb-4b74-bb46-17c0f60ae8b1",
      fieldName: "carrier",
      type: "CC",
      displayName: "Carrier Name",
      description:
        "This is the insurance carrier administering the policy Free text field with no special formatting requirements.",
      displayOrder: "140",
    },
    {
      id: "c023de66-71da-4224-a589-bbdbbd725836",
      fieldName: "client",
      type: "CC",
      displayName: "Client",
      description:
        "This is the name of the client. Free text field with no special formatting requirements.",
      displayOrder: "200",
    },
    {
      id: "c8fb4e5f-abfc-4f3f-bf0c-f6f1467a6dda",
      fieldName: "CommissionBase",
      type: "CC",
      displayName: "Commission Base",
      description: null,
      displayOrder: null,
    },
    {
      id: "895538a8-147a-481b-b3a0-c693d142bfd9",
      fieldName: "commissionPerc",
      type: "CC",
      displayName: "Commission Percentage",
      description:
        "commissionPerc field representing numeric. Values should be numeric with three decimal places (e.g., 1234.567).",
      displayOrder: "490",
    },
    {
      id: "e07b0dd3-9a95-473c-a035-07632c55db3e",
      fieldName: "commissionTotal",
      type: "CC",
      displayName: "Commission Paid",
      description:
        "This is the amount paid to the agency by the carrier for that line item Values should be numeric with two decimal places (e.g., 1234.56).",
      displayOrder: "500",
    },
    {
      id: "9aae3275-a12c-4f04-bde7-d3ea372f7987",
      fieldName: "commRate",
      type: "CC",
      displayName: "Comm Rate",
      description: null,
      displayOrder: null,
    },
    {
      id: "6baad197-8fa6-4f03-9127-7cd41c3f25f5",
      fieldName: "compScheduleType",
      type: "CC",
      displayName: "Comp Schedule",
      description:
        "Carriers can have standardized commission schedules based on certain sects of their insured book of business. This will indicate what block this arrangement falls under to denote what the commission is going to be Free text field with no special formatting requirements.",
      displayOrder: "440",
    },
    {
      id: "235da2de-8380-4038-9b35-1fcdcb31076e",
      fieldName: "CompStruct",
      type: "CC",
      displayName: "Comp Struct",
      description: null,
      displayOrder: null,
    },
    {
      id: "d3304129-489e-4870-92f5-ffacde3ee95c",
      fieldName: "compType",
      type: "CC",
      displayName: "Comp Type",
      description:
        "There are different types of payments carriers make to agencies, commissions, overrides, bonuses, etc. This is the type of payment that is being made Free text field with no special formatting requirements.",
      displayOrder: "420",
    },
    {
      id: "b0bdfddf-d7a8-4f37-b14a-46972c7b2daa",
      fieldName: "CoverageMonth",
      type: "CC",
      displayName: "Coverage Month",
      description: null,
      displayOrder: null,
    },
    {
      id: "74e1b9a0-a618-41bd-aa2a-3946a95c3a91",
      fieldName: "documentID",
      type: "CC",
      displayName: "Document Id",
      description: null,
      displayOrder: null,
    },
    {
      id: "89425a75-1d1d-4813-a6f2-c2eef5a42ee7",
      fieldName: "dollarPerUnit",
      type: "CC",
      displayName: "Dollars Per Unit",
      description:
        "A flat dollar amount that is paid to the agency as a commission per member enrolled in the plan Values should be numeric with two decimal places (e.g., 1234.56).",
      displayOrder: "400",
    },
    {
      id: "f8fa0e8d-7ce7-4bcb-b8cf-5abbde7dd580",
      fieldName: "effectiveDate",
      type: "CC",
      displayName: "Effective Date",
      description:
        "This is the original date the policy became effective at this carrier",
      displayOrder: "280",
    },
    {
      id: "82624250-1c8a-4dcd-af98-e6c40454ec61",
      fieldName: "extrafield1",
      type: "CC",
      displayName: "Extrafield1",
      description: null,
      displayOrder: null,
    },
    {
      id: "53768f17-f195-4c9a-8928-3e434597ef19",
      fieldName: "flag",
      type: "CC",
      displayName: "Flag",
      description: null,
      displayOrder: null,
    },
    {
      id: "9bb1a5d5-124d-4334-818d-6de3c681dda8",
      fieldName: "grossCommission",
      type: "CC",
      displayName: "Gross Commission",
      description:
        "This is the amount the agency earned in commission based on the number of enrolled or amount of premium before any adjustments or chargebacks are made to the payment before paying agency. Most often, this will be the same as the end commission amount. Values should be numeric with two decimal places (e.g., 1234.56).",
      displayOrder: "460",
    },
    {
      id: "42acf101-1c5a-4249-ba93-3caa4bed7d39",
      fieldName: "insured",
      type: "CC",
      displayName: "Insured",
      description:
        "This is the actual insured. It is typical the same as the client or a individual covered within the client Free text field with no special formatting requirements.",
      displayOrder: "200",
    },
    {
      id: "9375f688-8403-48e6-ad2e-db50e9978b14",
      fieldName: "invoiceDate",
      type: "CC",
      displayName: "Invoice Date",
      description:
        "This is the date the premium was due from insured to carrier",
      displayOrder: "300",
    },
    {
      id: "c969e6c1-cd57-43e1-ba74-6bb3add27416",
      fieldName: "ledgerAgent",
      type: "CC",
      displayName: "Ledger Agent",
      description:
        "Ledger Agent field representing text. Free text field with no special formatting requirements.",
      displayOrder: null,
    },
    {
      id: "dd69f05d-17a8-4286-a036-1e8bbe555281",
      fieldName: "ledgerDepositAmt",
      type: "CC",
      displayName: "Ledger Deposit Amount",
      description:
        "Ledger Deposit Amount field representing numeric. Values should be numeric with two decimal places (e.g., 1234.56).",
      displayOrder: null,
    },
    {
      id: "58ea0c4b-6e4e-4e6c-8d74-1f35ac35dc3e",
      fieldName: "ledgerDepositDate",
      type: "CC",
      displayName: "Ledger Deposit Date",
      description: "Ledger Deposit Date field representing mm/dd/yyyy.",
      displayOrder: null,
    },
    {
      id: "4760ca30-d716-4b2e-9db2-9c62e9dde72e",
      fieldName: "ledgerMonth",
      type: "CC",
      displayName: "Ledger Month",
      description:
        "Ledger Month field representing text. Free text field with no special formatting requirements.",
      displayOrder: null,
    },
    {
      id: "25d54836-dff3-4c84-8866-eaa55aacd01a",
      fieldName: "ledgerStatementAdj",
      type: "CC",
      displayName: "Ledger Statement Adjustment",
      description:
        "Ledger Statement Adjustment field representing numeric. Values should be numeric with two decimal places (e.g., 1234.56).",
      displayOrder: null,
    },
    {
      id: "dcd6dd30-2dbb-42a3-ba5c-d496864f2ba1",
      fieldName: "ledgerStatementDate",
      type: "CC",
      displayName: "Ledger Statement Date",
      description: "Ledger Statement Date field representing mm/dd/yyyy.",
      displayOrder: null,
    },
    {
      id: "f3fd7e1d-cd40-4a84-967b-b34ca7de0c51",
      fieldName: "ledgerStatementGross",
      type: "CC",
      displayName: "Ledger Statement Total",
      description:
        "Ledger Statement Total field representing numeric. Values should be numeric with two decimal places (e.g., 1234.56).",
      displayOrder: null,
    },
    {
      id: "c0a6d656-46bc-4959-a70b-2e50364b84cc",
      fieldName: "ledgerStatementNet",
      type: "CC",
      displayName: "Ledger Statement Net",
      description:
        "Ledger Statement Net field representing numeric. Values should be numeric with two decimal places (e.g., 1234.56).",
      displayOrder: null,
    },
    {
      id: "fb6bfbf4-a406-4d7c-a869-1cf408c6bb00",
      fieldName: "ledgerStatus",
      type: "CC",
      displayName: "Ledger Status",
      description:
        "Ledger Status field representing text. Free text field with no special formatting requirements.",
      displayOrder: null,
    },
    {
      id: "68a7a0fa-b139-4f42-99b0-27109d62277f",
      fieldName: "lineOfBusiness",
      type: "CC",
      displayName: "Line of Business",
      description:
        "This is the type of customer/policy this policy is in effect for whether its an individual or business entity Free text field with no special formatting requirements.",
      displayOrder: "520",
    },
    {
      id: "b638d694-e844-48ee-8cce-4993fdef034d",
      fieldName: "mode",
      type: "CC",
      displayName: "Mode",
      description:
        "This is how often payments are due to carrier from insured (Monthly, Quarterly, Semi-Annual, Annual) Free text field with no special formatting requirements.",
      displayOrder: "320",
    },
    {
      id: "22cc983b-49eb-4a20-8367-0231ac01c2e8",
      fieldName: "monthsAdvanced",
      type: "CC",
      displayName: "Months Advanced",
      description: null,
      displayOrder: null,
    },
    {
      id: "d6791324-1b14-495e-941c-fd037be6d92e",
      fieldName: "notes",
      type: "CC",
      displayName: "Notes",
      description: null,
      displayOrder: null,
    },
    {
      id: "1d693828-8242-441e-9d31-6fea0670b50e",
      fieldName: "OriginalPolicyNumber",
      type: "CC",
      displayName: "Original Policy Number",
      description:
        "This is a number that was associated with the policy when originally written. If the policy stayed active but the carrier changed the policy number, it is a way for them to link the two indicated policy numbers for reference Free text field with no special formatting requirements.",
      displayOrder: "96",
    },
    {
      id: "c8ce12b5-9fbf-4182-ad24-d96d948dd612",
      fieldName: "Override",
      type: "CC",
      displayName: "Override",
      description: null,
      displayOrder: null,
    },
    {
      id: "590ef8c7-4f8f-45f1-a5b8-679fe338c5d9",
      fieldName: "paidToDate",
      type: "CC",
      displayName: "Paid To Date",
      description: null,
      displayOrder: null,
    },
    {
      id: "d74e4862-5700-4f9b-9c20-f1f3c9e3ebfe",
      fieldName: "payor",
      type: "CC",
      displayName: "Payor Name",
      description:
        "This is the entity that pays the agency. It's can be a carrier, general agent or another party. Free text field with no special formatting requirements.",
      displayOrder: "135",
    },
    {
      id: "82969b1d-fbe6-461c-84b6-07eb77920980",
      fieldName: "policyNumber",
      type: "CC",
      displayName: "Policy Number",
      description:
        "This is the primary policy. Values should be numeric with two decimal places (e.g., 1234.56).",
      displayOrder: "160",
    },
    {
      id: "d07fa9f7-567f-4ea3-ad99-cf981b7b9961",
      fieldName: "policyNumber2",
      type: "CC",
      displayName: "Alt Policy Number",
      description:
        "This is a secondary policy number the payor or carrier may assign. Values should be numeric with two decimal places (e.g., 1234.56).",
      displayOrder: "180",
    },
    {
      id: "160fd739-b9b6-472f-b3fb-d33cb5cab0ea",
      fieldName: "policyType",
      type: "CC",
      displayName: "Policy Type",
      description:
        "policyType field representing text. Free text field with no special formatting requirements.",
      displayOrder: "510",
    },
    {
      id: "6cb7b356-b3c2-45f4-adc3-b6e48981ad7d",
      fieldName: "premBill",
      type: "CC",
      displayName: "Premium Billed",
      description:
        "This is the amount the carrier billed the insured Values should be numeric with two decimal places (e.g., 1234.56).",
      displayOrder: "340",
    },
    {
      id: "61cde9e5-7b43-4e1b-a844-4a44b9ed7573",
      fieldName: "premPaid",
      type: "CC",
      displayName: "Premium Paid",
      description:
        "This is the amount the insured paid the carrier Values should be numeric with two decimal places (e.g., 1234.56).",
      displayOrder: "360",
    },
    {
      id: "9522c3b7-6a9a-42d0-97ad-0f314166eac0",
      fieldName: "producerID",
      type: "CC",
      displayName: "Producer ID",
      description:
        "Carrier assigned code for the Writing producer of the policy. Free text field with no special formatting requirements.",
      displayOrder: "20",
    },
    {
      id: "1c871d5e-ee99-4b39-a32b-859acd29b412",
      fieldName: "producerName",
      type: "CC",
      displayName: "Producer Name",
      description:
        "Writing producer of the policy Free text field with no special formatting requirements.",
      displayOrder: "40",
    },
    {
      id: "6169d2e8-a3cc-43d9-a161-7d738a673321",
      fieldName: "product",
      type: "CC",
      displayName: "Product",
      description:
        "This is the line of coverage or product of the policy Free text field with no special formatting requirements.",
      displayOrder: "240",
    },
    {
      id: "2a0df50a-eabe-4de6-bc35-8a8c1cabc860",
      fieldName: "productType",
      type: "CC",
      displayName: "Product Type",
      description:
        "This is typically a more precise description of the product. Free text field with no special formatting requirements.",
      displayOrder: "260",
    },
    {
      id: "66d972bd-e472-4caa-a1cc-8f41c54ce4c7",
      fieldName: "rateSymbol",
      type: "CC",
      displayName: "Rate Symbol",
      description: null,
      displayOrder: null,
    },
    {
      id: "9f20d777-c65e-409b-9cb5-6c0855fa7c13",
      fieldName: "splitPercentage",
      type: "CC",
      displayName: "Split Percentage",
      description:
        "This is the amount of commission that is allocated to this payee. It can be 0-100% Values should be numeric with three decimal places (e.g., 1234.567).",
      displayOrder: "480",
    },
    {
      id: "f0ba8905-370e-4212-9891-b268bd5f2dc7",
      fieldName: "statementTotal",
      type: "CC",
      displayName: "Statement Total",
      description:
        "Statement gross total Values should be numeric with two decimal places (e.g., 1234.56).",
      displayOrder: "650",
    },
    {
      id: "427ccdb3-eb93-45da-8f43-184486d5f571",
      fieldName: "status",
      type: "CC",
      displayName: "Status",
      description: null,
      displayOrder: null,
    },
    {
      id: "7582677f-a5a3-4141-93d9-3c3288b8f021",
      fieldName: "stmntDate",
      type: "CC",
      displayName: "Statement Date",
      description:
        "Date of Statement - typically notes the end of the commission period that statement details. can be a range - always take end of range date",
      displayOrder: "670",
    },
    {
      id: "6a5bfd66-6db3-4811-85d1-6311c5ef9e97",
      fieldName: "stmntPaidDate",
      type: "CC",
      displayName: "Statement Paid Date",
      description: "Date of Deposit from Payor",
      displayOrder: "660",
    },
    {
      id: "bfa21aee-8358-49d1-bfed-4085281498b4",
      fieldName: "TransactionCode",
      type: "CC",
      displayName: "Transaction Code",
      description: null,
      displayOrder: null,
    },
    {
      id: "aa0e1025-45b5-4f84-b765-538a49132426",
      fieldName: "TransactionDate",
      type: "CC",
      displayName: "Transaction Date",
      description: null,
      displayOrder: null,
    },
    {
      id: "363d7f71-13c1-46c1-86ad-5ea291d42971",
      fieldName: "units",
      type: "CC",
      displayName: "Units",
      description:
        "This is the amount of insured members that are covered in the insurancec policy Values should be numeric with two decimal places (e.g., 1234.56).",
      displayOrder: "380",
    },
    {
      id: "1da3d268-aaa3-4dcd-9eda-d005102a605b",
      fieldName: "vendorID",
      type: "CC",
      displayName: "Vendor ID",
      description: null,
      displayOrder: null,
    },
    {
      id: "00f0fbbf-4681-4674-8596-5a49dc6d2a58",
      fieldName: "AgentName",
      type: "AMS",
      displayName: "Agent Name",
      description: null,
      displayOrder: null,
    },
    {
      id: "f75be044-6b58-4a6e-96b4-103d44ddf804",
      fieldName: "BillFromDate",
      type: "AMS",
      displayName: "Bill From Date",
      description: null,
      displayOrder: null,
    },
    {
      id: "a6263be4-5cdc-427e-9667-4efdd77a6e7a",
      fieldName: "CarrierAbbrev",
      type: "AMS",
      displayName: "Carrier Abbreviation",
      description: null,
      displayOrder: null,
    },
    {
      id: "b8e55fdb-cdb9-435c-ab2c-bf3466c29074",
      fieldName: "Carrier Product",
      type: "AMS",
      displayName: "Carrier Product",
      description: null,
      displayOrder: null,
    },
    {
      id: "fbd5d688-81a0-4841-a24e-f18a60de57c0",
      fieldName: "Commission",
      type: "AMS",
      displayName: "Commission",
      description: null,
      displayOrder: null,
    },
    {
      id: "e7c4c7ba-128c-4140-b30a-c93d09d11969",
      fieldName: "CompType",
      type: "AMS",
      displayName: "Compensation Type",
      description: null,
      displayOrder: null,
    },
    {
      id: "1d9a7759-f758-4c9f-9d12-0eeb30fe8e1b",
      fieldName: "CovgType",
      type: "AMS",
      displayName: "Coverage Type",
      description: null,
      displayOrder: null,
    },
    {
      id: "cc949034-7188-4b30-82f8-88581f0da3b4",
      fieldName: "Eff Date",
      type: "AMS",
      displayName: "Effective Date",
      description: null,
      displayOrder: null,
    },
    {
      id: "008e74d3-3044-4a8b-bb1c-7d5179b31366",
      fieldName: "InRate",
      type: "AMS",
      displayName: "In Rate",
      description: null,
      displayOrder: null,
    },
    {
      id: "b74af1ff-d97e-41b3-9c08-618f9e08426a",
      fieldName: "Lives",
      type: "AMS",
      displayName: "Lives",
      description: null,
      displayOrder: null,
    },
    {
      id: "80a32829-5054-4a81-9b13-d03f377fadbf",
      fieldName: "Note",
      type: "AMS",
      displayName: "Note",
      description: null,
      displayOrder: null,
    },
    {
      id: "891c3ed3-9a66-49d2-a1bb-71c6ac9b96fa",
      fieldName: "Policyholder",
      type: "AMS",
      displayName: "Policy Holder",
      description: null,
      displayOrder: null,
    },
    {
      id: "be77b02a-67eb-4438-9f02-b645689e1bbb",
      fieldName: "PolicyNum",
      type: "AMS",
      displayName: "Policy Number",
      description: null,
      displayOrder: null,
    },
    {
      id: "176ebc63-3b3e-4e98-82d0-cd15d72b9cde",
      fieldName: "Premium",
      type: "AMS",
      displayName: "Premium",
      description: null,
      displayOrder: null,
    },
  ];

  const filteredFields = fields.filter((field) =>
    field.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOnInput = (e) => {
    // If suggestions are open and user is typing after @
    if (suggestionOpen) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const textContent = editorRef.current.textContent;

        // Find the @ character before current position
        let currentPos = 0;
        let walker = document.createTreeWalker(
          editorRef.current,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );

        let node;
        while ((node = walker.nextNode())) {
          if (node === range.startContainer) {
            currentPos += range.startOffset;
            break;
          } else {
            currentPos += node.textContent.length;
          }
        }

        // Look for @ before current position
        let atIndex = -1;
        for (let i = currentPos - 1; i >= 0; i--) {
          const char = textContent[i];
          if (char === "@") {
            atIndex = i;
            break;
          }
          if (char === " " || char === "\n") {
            break; // Stop searching if we hit whitespace
          }
        }

        if (atIndex !== -1) {
          const searchText = textContent.substring(atIndex + 1, currentPos);
          setSearchTerm(searchText);
        } else {
          setSuggestionOpen(false);
        }
      }
    }else{
      setValue(convertEditorContentToPlain(editorRef.current.innerHTML));
    }
  };


  function convertEditorContentToPlain(text) {
  // Parse the HTML string
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/html");

  // Replace all mention spans with @@...@@
  doc.querySelectorAll(".mention-span").forEach(span => {
    const innerText = span.querySelector("span")?.textContent || "";
    const replacement = `@@${innerText}@@`;
    span.replaceWith(replacement);
  });

  // Return the plain text (with preserved spacing)
  return doc.body.innerHTML
    .replace(/&nbsp;/g, " ") // convert non-breaking space
    .replace(/\s+/g, " ")    // normalize spaces
    .trim();
}

 function convertPlainToEditorContent(text) {
  console.log("Converting plain to editor content:", text);
  // Regex to find @@...@@ mentions
    return text.replace(/@@(.*?)@@/g, (match, mentionText) => {
      return `
        <span contenteditable="false" class="mention-span" data-field-id="">
          <img src="./Carrier_Connect.png" alt="${mentionText}" draggable="false">
          <span>${mentionText}</span>
        </span>
      `;
    }); // preserve spaces like editor does

    //   return text.replace(/@@(.*?)@@/g, (match, mentionText) => {
    //   return `
    //     <span contenteditable="false" class="mention-span" data-field-id="">
    //       <img src="./Carrier_Connect.png" alt="${mentionText}" draggable="false">
    //       <span>${mentionText}</span>
    //     </span>
    //   `;
    // }).replace(/ /g, "&nbsp;"); // preserve spaces like editor does
  }

  const insertField = (field) => {
    if (!atSignRange || !savedRange) {
      setSuggestionOpen(false);
      return;
    }
    try {
      // Create the field span element
      const span = document.createElement("span");
      span.contentEditable = "false";
      span.className = "mention-span";
      // span.textContent = `${field.displayName}`;
      span.setAttribute("data-field-id", field.id);

      // // Add image inside span
      const img = document.createElement("img");
      img.src = "./Carrier_Connect.png"; // Replace with your image URL
      img.alt = field.displayName;
      img.draggable = false;

      // // add text
      const fieldName = document.createElement("span");
      fieldName.textContent = field.displayName;

      // // Append image + text
      span.appendChild(img);
      span.appendChild(fieldName);


      // Get current selection
      const selection = window.getSelection();
      selection.removeAllRanges();

      // Find and replace everything from @ to current cursor position
      const currentRange = document.createRange();
      const walker = document.createTreeWalker(
        editorRef.current,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let atNode = null;
      let atOffset = -1;
      let currentNode = null;
      let currentOffset = 0;

      // Find the @ character
      let node;
      while ((node = walker.nextNode())) {
        const text = node.textContent;
        const atIndex = text.lastIndexOf("@");

        if (atIndex !== -1) {
          // Check if this @ is before or at our saved position
          atNode = node;
          atOffset = atIndex;
          break;
        }
      }

      if (atNode && atOffset !== -1) {
        // Create range from @ to current cursor position
        currentRange.setStart(atNode, atOffset);

        // Set end to current cursor position
        const currentSelection = window.getSelection();
        if (currentSelection.rangeCount > 0) {
          const cursorRange = currentSelection.getRangeAt(0);
          currentRange.setEnd(
            cursorRange.startContainer,
            cursorRange.startOffset
          );
        } else {
          // Fallback: set end after the @ character
          currentRange.setEnd(atNode, atOffset + 1);
        }

        // Delete the selected content (@ and any typed text)
        currentRange.deleteContents();

        // Insert the field span
        currentRange.insertNode(span);


        // Position cursor after the span
        currentRange.setStartAfter(span);
        currentRange.setEndAfter(span);
        selection.removeAllRanges();
        selection.addRange(currentRange);



        // Add a space after the field
        const spaceNode = document.createTextNode("\u00A0");
        currentRange.insertNode(spaceNode);
        currentRange.setStartAfter(spaceNode);
        currentRange.setEndAfter(spaceNode);
        selection.removeAllRanges();
        selection.addRange(currentRange);
      }

      setSuggestionOpen(false);
      setAtSignRange(null);
      setSavedRange(null);

      // Focus back to editor
      editorRef.current.focus();
    } catch (error) {
      console.error("Error inserting field:", error);
      setSuggestionOpen(false);
    }
  };

  return (
    <div className="p-4">
      {suggestionOpen && (
        <div
          style={{
            position: "fixed",
            top: suggestionPosition.y + 10,
            left: suggestionPosition.x,
            zIndex: 1000,
          }}
          ref={suggestionRef}
          className="shadow-2xl"
        >
          <div className="bg-white rounded-lg border border-gray-300 w-50 max-h-96">
            {/* Header */}
            <div className="flex items-center justify-between p-3  rounded-lg">
              <h2 className="text-sm font-semibold text-gray-900">
                Available Fields
              </h2>
              <button
                onClick={() => setSuggestionOpen(false)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="border-b p-3 pt-0 border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search fields..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Fields List */}
            <div className="max-h-64 overflow-y-auto ">
              {filteredFields.map((field, idx) => (
                <div
                  onClick={() => insertField(field)}
                  tabIndex={0} // Make div focusable
                  ref={(el) => (itemRefs.current[idx] = el)}
                  key={field.id}
                  className={`suggestion-item flex p-3 py-1 items-center gap-3  cursor-pointer transition-colors   ${
                    idx === highlightIndex
                      ? "bg-[#f5f5f5]"
                      : "hover:bg-[#f5f5f5] focus:bg-[#f5f5f5]"
                  }`}
                  // className="suggestion-item flex items-center gap-3 p-3 hover:bg-blue-50 focus:bg-blue-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                >
                 <img src="./Carrier_Connect.png" height={20} width={20}/>
                  <div className="flex-1">
                    <span className="text-sm text-[#000000] ">
                      {field.displayName}
                    </span>
                  </div>

                </div>
              ))}

              {filteredFields.length === 0 && (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No fields found matching "{searchTerm}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <h1 className="text-xl font-bold mb-2">
          WYSIWYG Editor with Field Insertion
        </h1>
        <p className="text-sm text-gray-600">
          Type "@" to insert a field. Use ↑/↓ arrows to navigate, Enter to
          select, Escape to close.
        </p>
      </div>

      <style>
        {`
    [contenteditable][data-placeholder]:empty:before {
      content: attr(data-placeholder);
      color: #9ca3af; /* Tailwind gray-400 */
      pointer-events: none;
      display: block;
    }
  `}
      </style>
      <div
        ref={editorRef}
        contentEditable={true}
        onKeyDown={handleKeyDown}
        onInput={handleOnInput}
        data-placeholder="Type @ to insert a field..."
        className="border border-gray-300 rounded-lg p-4 min-h-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        style={{
          fontSize: "14px",
          lineHeight: "1.5",
        }}
      ></div>
    </div>
  );
}

