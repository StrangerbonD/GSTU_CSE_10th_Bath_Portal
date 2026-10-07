"use client";

import React, { useEffect, useRef, useState } from "react";

export function ProvisionalCertificate({
  transcript,
  certificateData,
  issueDate = "16-9-2026",
  examYear = "2024",
  heldIn = "April, 2026",
  serialNo,
}) {
  const data = transcript || certificateData || {};

  // Enforce strictly 2 digits after decimal point for CGPA (e.g. 2.87, 3.57, 4.00)
  const cgpaFormatted = Number(data.cgpa || 0).toFixed(2);

  // Generate realistic serial matching original: CSE-002009034
  const generatedSerial =
    serialNo ||
    (() => {
      const cleanId = (data.studentId || "").replace(/\D/g, "");
      return `CSE-0020${cleanId.padStart(5, "0")}`;
    })();

  // Responsive proportional scaling to maintain exact layout and line breaks across all screens
  const wrapperRef = useRef(null);
  const [scale, setScale] = useState(1);

  const useIsomorphicLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : useEffect;

  useIsomorphicLayoutEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current) {
        const availableWidth = wrapperRef.current.offsetWidth;
        const targetWidth = 800;
        const newScale = Math.min(1, Math.max(0.36, (availableWidth - 16) / targetWidth));
        setScale(newScale);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sheetHeight = 1131; // Exact A4 aspect ratio 1 : 1.414 for 800px width

  return (
    <div ref={wrapperRef} className="w-full flex justify-center overflow-x-hidden py-2 sm:py-6 print:py-0 print:m-0 print:overflow-visible print:block">
      <div
        suppressHydrationWarning
        style={{
          width: "800px",
          height: `${sheetHeight}px`,
          transform: scale < 1 ? `scale(${scale})` : undefined,
          transformOrigin: "top center",
          marginBottom: scale < 1 ? `-${Math.round(sheetHeight * (1 - scale))}px` : undefined,
        }}
        className="certificate-sheet relative bg-[#FAF8F1] text-black shrink-0 select-none shadow-2xl print:shadow-none print:m-0 print:transform-none print:!w-[210mm] print:!max-w-[210mm] print:!h-[296mm] print:!max-h-[296mm] print:!overflow-hidden print:break-inside-avoid print:page-break-inside-avoid print:break-after-avoid"
      >
        {/* Subtle authentic paper texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 mix-blend-multiply"
          style={{
            backgroundImage: `radial-gradient(#e5dfcc 0.65px, transparent 0.65px), radial-gradient(#e5dfcc 0.65px, #FAF8F1 0.65px)`,
            backgroundSize: "24px 24px",
            backgroundPosition: "0 0, 12px 12px",
          }}
        />

        {/* Certificate Inner Canvas with exact margins */}
        <div className="relative z-10 w-full h-full px-[56px] pt-[48px] pb-[36px] flex flex-col justify-start print:px-[44px] print:pt-[34px] print:pb-[24px]">
          
          {/* --- 1. TOP HEADER SECTION --- */}
          <div className="text-center">
            
            {/* University Title (Single Line, Old English / Gothic) */}
            <h1 className="font-gothic text-[35px] leading-tight text-[#0f0f0f] font-bold tracking-tight whitespace-nowrap">
              Gopalganj Science and Technology University
            </h1>

            {/* Official GSTU Green Square Emblem */}
            <div className="flex justify-center my-[14px]">
              <div className="w-[72px] h-[72px] bg-[#008000] p-1 shadow-xs flex items-center justify-center">
                <img
                  src="/images/certificate/gstu_logo.jpeg"
                  alt="GSTU Official Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Document Subtitle */}
            <h2 className="font-cert-serif font-bold text-[13.5px] tracking-[0.22em] text-[#111111] uppercase mt-1 mb-1">
              PROVISIONAL CERTIFICATE FOR
            </h2>

            {/* Degree Title (Single Line, Gothic / Blackletter) */}
            <h3 className="font-gothic text-[26px] leading-tight text-[#0f0f0f] font-bold tracking-normal whitespace-nowrap mt-1.5 mb-6 print:mb-4">
              Bachelor of Science in Engineering
            </h3>

            {/* "This is to certify that" */}
            <p className="font-script text-[29px] italic text-[#1a1a1a] mb-1">
              This is to certify that
            </p>

            {/* Student Name */}
            <div className="w-full pt-1 pb-1">
              <p className="font-script text-[38px] font-bold text-[#050505] tracking-wide inline-block whitespace-nowrap">
                {data.studentName}
              </p>
            </div>

            {/* Long Horizontal Underline below Student Name */}
            <div className="w-full border-b-[1.2px] border-black mt-[-2px] mb-[34px] print:mb-[22px]" />

          </div>

          {/* --- 2. EXACT 4-LINE BODY PARAGRAPH --- */}
          <div className="w-full space-y-[24px] text-[#111111] print:space-y-[18px]">
            
            {/* LINE 1: bearing student ID [StudentID] is awarded the degree of */}
            <div className="flex items-baseline justify-between w-full font-script text-[22px] leading-none">
              <span className="shrink-0 whitespace-nowrap">bearing student ID</span>
              <span className="border-b-[1.2px] border-black text-center flex-1 mx-3 px-2 font-cert-serif text-[21px] italic font-semibold text-[#050505] tracking-wide whitespace-nowrap">
                {data.studentId}
              </span>
              <span className="shrink-0 whitespace-nowrap">is awarded the degree of</span>
            </div>

            {/* LINE 2: [Degree] in [Department] from this */}
            <div className="flex items-baseline justify-between w-full font-script text-[22px] leading-none">
              <span className="border-b-[1.2px] border-black text-center min-w-[130px] px-1.5 font-script text-[22px] text-[#050505] whitespace-nowrap shrink-0">
                B.Sc. (Engg.)
              </span>
              <span className="shrink-0 mx-2.5 whitespace-nowrap">in</span>
              <span className="border-b-[1.2px] border-black text-center flex-1 mx-2.5 px-2 font-script text-[23px] font-bold text-[#050505] tracking-wide whitespace-nowrap">
                {(data.department || "Computer Science and Engineering")
                  .replace(/^Department of\s+/i, "")
                  .trim() || "Computer Science and Engineering"}
              </span>
              <span className="shrink-0 whitespace-nowrap">from this</span>
            </div>

            {/* LINE 3: University at the examination of [ExamYear] held in [HeldIn] and */}
            <div className="flex items-baseline justify-between w-full font-script text-[22px] leading-none">
              <span className="shrink-0 whitespace-nowrap">University at the examination of</span>
              <span className="border-b-[1.2px] border-black text-center min-w-[80px] max-w-[110px] flex-1 mx-2 px-1.5 font-cert-serif text-[21px] italic font-semibold text-[#050505] whitespace-nowrap">
                {examYear}
              </span>
              <span className="shrink-0 mx-2 whitespace-nowrap">held in</span>
              <span className="border-b-[1.2px] border-black text-center min-w-[120px] max-w-[155px] flex-1 mx-2 px-1.5 text-[#050505] whitespace-nowrap">
                {heldIn.includes(",") ? (
                  <>
                    <span className="font-script text-[22px]">{heldIn.split(",")[0]}, </span>
                    <span className="font-cert-serif text-[21px] italic font-semibold">{heldIn.split(",")[1]?.trim()}</span>
                  </>
                ) : (
                  <span className="font-script text-[22px]">{heldIn}</span>
                )}
              </span>
              <span className="shrink-0 whitespace-nowrap">and</span>
            </div>

            {/* LINE 4: He/She obtained CGPA [CGPA] on a scale of 4.00. */}
            <div className="flex items-baseline justify-start w-full font-script text-[22px] leading-none">
              <span className="shrink-0 whitespace-nowrap">He/She obtained CGPA</span>
              <span className="border-b-[1.2px] border-black text-center min-w-[75px] mx-3 px-2 font-cert-serif text-[21px] italic font-semibold text-[#050505] whitespace-nowrap">
                {cgpaFormatted}
              </span>
              <span className="shrink-0 whitespace-nowrap">on a scale of 4.00.</span>
            </div>

          </div>

          {/* --- 3. BOTTOM SECTION: ADMINISTRATIVE & SIGNATURE --- */}
          <div className="w-full mt-auto print:mt-auto print:break-inside-avoid print:page-break-inside-avoid">
            
            <div className="flex items-end justify-between px-1">
              
              {/* Left: Administrative Building & Handwritten Issue Date */}
              <div className="text-left font-cert-serif text-[14.5px] leading-[1.35] text-[#111111]">
                <p className="font-semibold text-black">Administrative Building</p>
                <p>Gopalganj-8100, Bangladesh.</p>
                <p className="pt-1.5 flex items-baseline">
                  <span>Date of issue:</span>
                  <span className="font-handwritten text-[22px] font-bold text-black ml-2 tracking-wide">
                    {issueDate}
                  </span>
                </p>
              </div>

              {/* Right: Controller of Examinations with Exact Extracted Signature */}
              <div className="text-center font-cert-serif flex flex-col items-center">
                <img
                  src="/images/certificate/controller_signature.png"
                  alt="Controller of Examinations Signature"
                  className="h-[44px] object-contain mb-1.5"
                />
                <p className="text-[15px] text-[#050505] font-medium tracking-wide">
                  Controller of Examinations
                </p>
              </div>

            </div>

            {/* Full-width Divider Line */}
            <div className="w-full border-t-[1.2px] border-black mt-7 mb-2 print:mt-4 print:mb-1.5" />

            {/* Surrender Notice & Serial Number */}
            <div className="text-center font-cert-serif text-[#1a1a1a]">
              <p className="text-[11.5px] leading-tight">
                Provisional Certificate must be surrendered at the time of taking the original certificate.
              </p>
              <p className="text-[12.5px] font-semibold text-black mt-1 tracking-wide">
                Serial No. {generatedSerial}
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default ProvisionalCertificate;
