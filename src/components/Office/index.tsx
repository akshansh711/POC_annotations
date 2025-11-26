"use client"
import React from 'react'
import PdfAnnotator from '../pdf-annotator'
import {useAppSelector} from "../../redux/hooks"
import JsonToPdfConverter from '../json-to-pdf';

function Office() {
   
  return (
    <div>
        <h1>POC work</h1>
        <JsonToPdfConverter />
    {/* <PdfAnnotator pdfUrl={pdfUrl as string}/> */}
    </div>
  )
}

export default Office