"use client";

import { useState, useEffect, useRef } from "react";
import PDFJS from "pdfjs-dist"
import { downloadPdf, getPdfBlob, PdfConfig, PdfData } from "../../utils/helpers/convert-json-to-pdf";
// import { SAMPLE_DATA } from "app/api/report";

import Button from "../Button";
import PdfAnnotator from "../pdf-annotator";
import { useAppSelector } from "@/src/redux/hooks";
import PdfAnnotatorTextSelect from "../pdf-annotator-text-select";

interface JsonToPdfConverterProps {
  data?: PdfData;
  filename?: string;
  config?: Partial<PdfConfig>;
  className?: string;
}

const SAMPLE_DATA = {
  fileName: "rfp_evaluation_report",
  fileType: "pdf",
  sections: [
    {
      heading: "RFP Summary",
      level: 1,
      content: [
        "The RFP outlines the development of the AI Pathfinder Tool for Idaho Digital Learning Alliance (IDLA). The tool aims to streamline course selection for middle and high school students, particularly those struggling to articulate their interests. Based on counselor interviews, the AI will emulate a supportive tone, ask broad exploratory questions, and use a branching logic framework tailored to college-bound, workforce-bound, or undecided students. It will provide personalized course recommendations using student data and allow iterative exploration through likes and dislikes. Persistent memory ensures continuity across sessions while counselors verify the AI's recommendations. This tool seeks to enhance students' confidence and simplify access to over 300 courses available in IDLA's catalog."
      ],
      tables: [],
      children: []
    },
    {
      heading: "Evaluation Criteria",
      level: 1,
      content: [
        "1. Public Sector Experience\n- Weight: 0.20",
        "2. Experience in Education Domain\n- Weight: 0.15",
        "3. AI Capability\n- Weight: 0.45",
        "4. Data Governance & Security Framework\n- Weight: 0.10",
        "5. Project Management & Implementation Methodology\n- Weight: 0.10"
      ],
      tables: [],
      children: []
    },
    {
      heading: "Evaluation Visualizations",
      level: 1,
      content: ["Evaluation Visualizations"],
      tables: [],
      children: []
    },
    {
      heading: "Proposal Evaluation Results",
      level: 1,
      content: [],
      tables: [],
      children: [
        {
          heading: "Proposal: Accenture Proposal for IDLA.pdf",
          level: 2,
          content: [],
          tables: [],
          children: [
            {
              heading: "1. Public Sector Experience",
              level: 3,
              content: [
                "Score: 7",
                "Weight: 0.2",
                "Contribution: 1.40",
                "Justification: The proposal meets the requirements well by demonstrating a strong understanding of the specific regulatory environment for public education, but it lacks explicit evidence of past public sector projects. Strengths: The proposal repeatedly highlights 'FERPA Compliance' as a key consideration under 'Domain Knowledge' and 'Integration & Security'. This demonstrates a clear understanding of the critical student data privacy requirements governing public educational institutions in the US. Furthermore, the proposal shows a solid grasp of the K-12 online learning domain, which is directly relevant to IDLA's mission. Weaknesses: The primary weakness is the absence of specific examples or case studies detailing work with other named public sector educational entities. While the proposal claims '15+ years of EdTech transformation projects' and '50+ successful AI implementation projects in education', it does not specify whether these were for public or private institutions. There is also no mention of experience with public procurement processes or the unique stakeholder dynamics of government-funded organizations. Overall, the vendor shows they understand the operational context of an organization like IDLA, but the lack of direct, verifiable public sector client experience prevents a higher score."
              ],
              tables: [],
              children: []
            },
            {
              heading: "2. Experience in Education Domain",
              level: 3,
              content: [
                "Score: 9",
                "Weight: 0.15",
                "Contribution: 1.35",
                "Justification: The proposal significantly exceeds the requirements for experience in the education domain. It provides strong evidence of a deep, research-backed understanding of the K-12 student guidance landscape. Strengths: - The vendor cites extensive and directly relevant experience, including '15+ years of EdTech transformation projects' and '50+ successful AI implementation projects in education'. - The proposal includes a detailed 'Current State Analysis' and specific 'Student Personas & Behaviors' (Goal-Oriented, Exploratory, Struggling) that directly align with the student profiles mentioned in the RFP (college-bound, workforce-bound, undecided). - It demonstrates a granular understanding of counseling processes by outlining a 'Current Workflow Analysis' for counselors and identifying key pain points such as limited time and inconsistent guidance. - The vendor acknowledges specific challenges from the RFP, like 'Vague course descriptions', and proposes concrete solutions within their 'Information Architecture Preferences' and 'Conversational Design Principles'. Weaknesses: - While the understanding of student needs is comprehensive, the proposal does not explicitly mention 'graduation requirements' as a key data point for guidance, which was noted in the RFP's summary of counselor information gathering. Overall, the proposal demonstrates exceptional domain expertise that goes beyond surface-level understanding, justifying a high score."
              ],
              tables: [],
              children: []
            },
            {
              heading: "3. AI Capability",
              level: 3,
              content: [
                "Score: 9",
                "Weight: 0.45",
                "Contribution: 4.05",
                'Justification: The proposal significantly exceeds the requirements for the AI Capability factor by providing a comprehensive, well-articulated, and technically detailed solution that aligns almost perfectly with the RFP\'s vision. Strengths: - Direct Alignment with Core Functionalities: The proposal explicitly addresses nearly every key functionality outlined in the evaluation factor. It includes a "Recommendation Engine with 3-5 tailored course suggestions," "Intelligent Branching Logic for personalized guidance flows," and a "Persistent Memory System for cross-session continuity" as in-scope items. This demonstrates a clear understanding of the requirements. - Sophisticated Technical Approach: The vendor proposes a "Hybrid AI (Rules + NLP)" approach using "LangGraph workflows for conversational orchestration." This is a robust and appropriate methodology that combines the predictability of rules with the flexibility of natural language processing, directly supporting the need for dynamic, personalized conversations. - Emulation of Counselor Tone: The "Conversational Design Principles" section directly mirrors the RFP\'s requirements, outlining a "Counselor-Like Tone & Approach" (warm, supportive, patient) and an "Exploratory Questioning Strategy" using open-ended questions. - Feedback and Iteration: The proposal\'s concept of "Rejection-Based Discovery" and "Student Preference Learning with iterative refinement" is a strong match for the RFP\'s requirement to use student ratings and dislikes to refine recommendations. - Persistent Memory: The commitment to a "Persistent Memory System" tied to the student profile to track preferences and ensure continuity across sessions is clearly stated in multiple sections, including the AI Workflow Architecture and Personalization Features. Weaknesses: - There are no significant weaknesses identified for this factor. The proposal provides a thorough and convincing plan that meets and exceeds the specified requirements. The vendor\'s approach is detailed, well-researched, and demonstrates a superior capability to deliver the AI Pathfinder Tool as envisioned.'
              ],
              tables: [],
              children: []
            },
            {
              heading: "4. Data Governance & Security Framework",
              level: 3,
              content: [
                "Score: 9",
                "Weight: 0.1",
                "Contribution: 0.90",
                'Justification: The proposal significantly exceeds the requirements for the Data Governance & Security Framework by presenting a comprehensive, multi-layered, and technically specific plan. The vendor demonstrates a profound understanding of handling sensitive student data, explicitly addressing the need for a secure login via "Student Portal SSO integration" and committing to "FERPA Compliance with data encryption." Strengths: - Technical Specificity: The proposal details robust security controls, including "AES-256 encryption for data at rest and in transit," "Role-Based Access Control with least privilege principle," "Multi-Factor Authentication" for counselors, and secure credential management using "Azure Key Vault or AWS Secrets Manager." - Mature Governance Principles: It goes beyond basic security by incorporating mature data governance concepts such as "Data Minimization," "Configurable retention policies," "Comprehensive logging for compliance," and a "Right to Deletion" for students. - Proactive Risk Management: A major strength is the identification of "Student Data Privacy & FERPA Compliance" as a high-priority risk, complete with a detailed mitigation strategy that includes expert consultation and regular audits. - Comprehensive Coverage: The framework addresses all aspects of the evaluation factor, including the secure storage of the "Persistent Memory System" under the same stringent data protection protocols. Weaknesses: - A minor point of ambiguity is the "Out of Scope" item for "Direct transcript synchronization with school systems." While this could impact real-time data access, the proposed SSO integration provides a secure mechanism to pull and use student data already available within the IDLA portal, which sufficiently addresses the core requirement. Overall, the proposal provides outstanding detail and strong evidence of a well-architected security and privacy framework, instilling high confidence in their ability to protect student information.'
              ],
              tables: [],
              children: []
            },
            {
              heading: "5. Project Management & Implementation Methodology",
              level: 3,
              content: [
                "Score: 9",
                "Weight: 0.1",
                "Contribution: 0.90",
                "Justification: The proposal significantly exceeds the requirements for this factor by presenting a clear, detailed, and highly structured project management and implementation methodology. The strengths are numerous and well-documented. Strengths: - Detailed Phased Approach: The proposal outlines a 17-week plan broken down into seven distinct phases, from 'Research & UX Validation' to 'Handoff & Documentation'. This demonstrates a comprehensive, end-to-end project view. - Specific Deliverables and Success Criteria: Each phase includes specific key activities, deliverables, and measurable success criteria. For example, Phase 3 (Conversational AI Flow Implementation) aims for 'AI engine handles 90%+ of common student interactions' and an '85%+ counselor approval rate,' which provides clear, quantifiable targets. - Robust Project Management: The inclusion of a 'Critical Path Analysis,' 'Resource Constraints,' and 'Risk Mitigation Strategies' shows a mature and proactive approach to project management, addressing potential bottlenecks and risks upfront. - Collaboration and Alignment: The methodology explicitly incorporates collaboration with IDLA through activities like 'Stakeholder Alignment' in Phase 1 and requirements for stakeholder approval of key deliverables like the technical architecture. Weaknesses: - There are no significant weaknesses identified for this factor. The methodology is thorough and well-suited for developing a complex AI tool as described in the RFP. Overall, the proposal provides a highly effective and confidence-inspiring implementation plan that directly addresses how the vendor will manage the development, testing, and implementation of the AI Pathfinder Tool, ensuring a structured process to meet IDLA's requirements.",
                "Final Weighted Score: 8.6/10\nWeighted Score %: 86.0%\nOverall Justification: The proposal is exceptionally strong across most key areas, scoring 9 out of 10 for AI Capability, Experience in Education Domain, Data Governance, and Project Management. These factors, which significantly exceed requirements, are supported by detailed, technically sound, and well-aligned plans. The primary weakness is in Public Sector Experience (score 7/10), where the proposal demonstrates a good understanding of the regulatory environment but lacks specific, verifiable case studies with public sector clients. Despite this, the overwhelming strengths in critical areas result in a high final weighted score of 8.6."
              ],
              tables: [],
              children: []
            }
          ]
        }
      ]
    }
  ],
  stats: {
    numSections: 10,
    numTables: 0
  }
};

export default function JsonToPdfConverter({
  data = SAMPLE_DATA,
  filename,
  config,
  className
}: JsonToPdfConverterProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const defaultConfig: Partial<PdfConfig> = {
    fonts: {
      fontFamily: "helvetica",
      title: { size: 22, style: "bold" },
      heading1: { size: 18, style: "bold" },
      heading2: { size: 16, style: "bold" },
      heading3: { size: 14, style: "bold" },
      body: { size: 11, style: "normal" }
    },
    colors: {
      heading1Color: [30, 58, 138] as [number, number, number],
      heading2Color: [59, 130, 246] as [number, number, number],
      heading3Color: [14, 116, 144] as [number, number, number],
      textColor: [31, 41, 55] as [number, number, number],
      tableHeaderBg: [229, 231, 235] as [number, number, number]
    },
    margins: {
      top: 20,
      bottom: 20,
      left: 20,
      right: 20
    },
    lineHeight: 7,
    paragraphSpacing: 3
  };

  useEffect(() => {
    return () => {
      if (pdfUrl && pdfUrl.startsWith("blob:")) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const handleGeneratePdf = async () => {
    setIsGenerating(true);
    try {
      const mergedConfig = {
        ...defaultConfig,
        ...config,
        fonts: {
          ...defaultConfig.fonts,
          ...config?.fonts
        },
        colors: {
          ...defaultConfig.colors,
          ...config?.colors
        }
      };

      const pdfBlob = await getPdfBlob(data, mergedConfig);
      const blobUrl = URL.createObjectURL(pdfBlob);

      if (pdfUrl && pdfUrl.startsWith("blob:")) {
        URL.revokeObjectURL(pdfUrl);
      }

      setPdfUrl(blobUrl);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const pdfFilename = filename || data?.fileName?.replace(/\.[^/.]+$/, "") || "rfp_evaluation_report";
      const mergedConfig = {
        ...defaultConfig,
        ...config,
        fonts: {
          ...defaultConfig.fonts,
          ...config?.fonts
        },
        colors: {
          ...defaultConfig.colors,
          ...config?.colors
        }
      };
      await downloadPdf(data, pdfFilename, mergedConfig);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF. Please check the console for details.");
    }
  };

  return (
    <>
        <h1>JSON to PDF Converter</h1>
        <p>Convert structured RFP evaluation JSON data to a formatted PDF document</p>
        <div className="flex gap-2">
          <Button title="Generate & View PDF" onClick={handleGeneratePdf} disable={isGenerating} />
         
          {pdfUrl && (
            <Button title="Download PDF" onClick={handleDownloadPdf} />
              
          )}
        </div>
        {pdfUrl && (
          <div className="border rounded-lg " style={{ height: "800px" }}>
            {/* <iframe src={pdfUrl} className="w-full h-full" title="PDF Viewer" style={{ border: "none" }} /> */}
            {pdfUrl && 
                <div style={{"border": "1px solid black", "overflow": "hidden"}}>
                <PdfAnnotator pdfUrl={pdfUrl}/>
                </div>
            }
            
          </div>
        )}
    </>
  );
}