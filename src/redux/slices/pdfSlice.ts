import { createSlice } from "@reduxjs/toolkit";

export interface initialProps {
    pdfUrl: string | null
}

const initialState: initialProps = {
    pdfUrl: null
}

export const pdfSlice = createSlice({
    name: "pdfSlice",
    initialState,
    reducers: {
        setPdfUrl: ((state,action) => {
            state.pdfUrl = action.payload;
        })
    }
})

export const { setPdfUrl } = pdfSlice.actions;
export default pdfSlice.reducer;