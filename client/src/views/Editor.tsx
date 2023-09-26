import React, { useEffect, useReducer, useState } from "react";
import styled from "styled-components";
import colors from "../style/colors";
import Header from "../components/Header";
import { useNavigate, useParams } from "react-router-dom";
import axios, { AxiosError } from "axios";
import JSZip from "jszip";
import EditorSideBar from "../components/EditorSideBar";
import SlideEditor from "../components/SlideEditor";
import {
  downloadProject,
  elaborateProject,
  retrieveProject,
} from "../services/project";
import { buildProject } from "../services/ppt";
import LoadingWidget from "../components/LoadingWidget";
import { H2, P } from "../components/Text";

interface Props {}

type DataWithTimestamp<DT> = {
  timestamp: number;
  data: DT;
};

export type AudioPreviewType = DataWithTimestamp<string | null> & {
  isProcessing: boolean;
};
export type NotesType = DataWithTimestamp<string>;

interface EditorState {
  unrepairableError?: string;
  error: {
    message?: string;
    id: number;
  };

  isDownloading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;

  slideFocus: number;

  audios: AudioPreviewType[];
  notes: NotesType[];
  slides: string[];

  projectZip: JSZip | null;
}

const initialState: EditorState = {
  isDownloading: false,
  isSaving: false,
  hasUnsavedChanges: false,

  error: {
    id: 0,
  },

  slideFocus: 0,

  audios: [],
  notes: [],
  slides: [],

  projectZip: null,
};

export enum EditorActionType {
  LOADING_COMPLETE = "LOAD_COMPLETE",
  LOADING_FAILURE = "LOADING_FAILURE",
  FOCUS_CHANGE = "FOCUS_CHANGE",
  FOCUS_INC = "FOCUS_INC",
  FOCUS_DEC = "FOCUS_DEC",
  NOTES_CHANGE = "NOTES_CHANGE",
  DOWNLOAD_INIT = "DOWNLOAD_INIT",
  DOWNLOAD_END = "DOWNLOAD_END",
  SAVE_INIT = "SAVE_INIT",
  SAVE_END = "SAVE_END",
  GENERATE_PREVIEW_INIT = "GENERATE_PREVIEW_INIT",
  GENERATE_PREVIEW_END = "GENERATE_PREVIEW_END",

  ERROR = "ERROR",
}

interface LoadCompleteAction {
  type: EditorActionType.LOADING_COMPLETE;
  payload: {
    audios: string[];
    notes: string[];
    slides: string[];
    projectZip: JSZip;
  };
}

interface LoadFailureAction {
  type: EditorActionType.LOADING_FAILURE;
  payload: {
    error: string;
  };
}

interface FocusChangeAction {
  type: EditorActionType.FOCUS_CHANGE;
  payload: {
    focus: number;
  };
}

interface FocusIncAction {
  type: EditorActionType.FOCUS_INC;
}

interface FocusDecAction {
  type: EditorActionType.FOCUS_DEC;
}

interface NotesChangeAction {
  type: EditorActionType.NOTES_CHANGE;
  payload: {
    notes: string;
  };
}

interface DownloadInitAction {
  type: EditorActionType.DOWNLOAD_INIT;
}
interface DownloadEndAction {
  type: EditorActionType.DOWNLOAD_END;
}

interface SaveInitAction {
  type: EditorActionType.SAVE_INIT;
}
interface SaveEndAction {
  type: EditorActionType.SAVE_END;
  payload: { success: boolean };
}

interface GeneratePreviewInitAction {
  type: EditorActionType.GENERATE_PREVIEW_INIT;
  payload: {
    slideIndex: number;
  };
}
interface GeneratePreviewEndAction {
  type: EditorActionType.GENERATE_PREVIEW_END;
  payload: {
    slideIndex: number;
    preview: string | null;
  };
}
interface ErrorAction {
  type: EditorActionType.ERROR;
  payload: {
    error: string;
  };
}

export type EditorAction =
  | LoadCompleteAction
  | LoadFailureAction
  | FocusChangeAction
  | FocusIncAction
  | FocusDecAction
  | NotesChangeAction
  | DownloadInitAction
  | DownloadEndAction
  | SaveInitAction
  | SaveEndAction
  | GeneratePreviewInitAction
  | GeneratePreviewEndAction
  | ErrorAction;

export function editorReducer(
  state: EditorState,
  action: EditorAction
): EditorState {
  const timestamp = Date.now();
  console.log(action);

  switch (action.type) {
    case EditorActionType.LOADING_COMPLETE:
      return {
        ...state,
        audios: addTimestampToDataList(action.payload.audios, timestamp).map(
          (v) => ({ ...v, isProcessing: false })
        ),
        notes: addTimestampToDataList(action.payload.notes, timestamp),
        slides: action.payload.slides,
        projectZip: action.payload.projectZip,
      };
    case EditorActionType.LOADING_FAILURE:
      return { ...state, unrepairableError: action.payload.error };
    case EditorActionType.FOCUS_CHANGE:
      return { ...state, slideFocus: action.payload.focus };
    case EditorActionType.FOCUS_INC:
      return {
        ...state,
        slideFocus: Math.min(state.slideFocus + 1, state.notes.length - 1),
      };
    case EditorActionType.FOCUS_DEC:
      return {
        ...state,
        slideFocus: Math.max(state.slideFocus - 1, 0),
      };
    case EditorActionType.NOTES_CHANGE:
      //Purposly not regenerating the notes array
      state.notes[state.slideFocus] = { data: action.payload.notes, timestamp };
      return { ...state, hasUnsavedChanges: true };
    case EditorActionType.DOWNLOAD_INIT:
      return { ...state, isDownloading: true };
    case EditorActionType.DOWNLOAD_END:
      return { ...state, isDownloading: false };
    case EditorActionType.SAVE_INIT:
      return { ...state, isSaving: true, hasUnsavedChanges: false };
    case EditorActionType.SAVE_END:
      console.log(state.hasUnsavedChanges, !action.payload.success);
      return {
        ...state,
        isSaving: false,
        hasUnsavedChanges: state.hasUnsavedChanges || !action.payload.success,
      };
    case EditorActionType.GENERATE_PREVIEW_INIT:
      return {
        ...state,
        audios: state.audios.map((v, i) =>
          i === action.payload.slideIndex ? { ...v, isProcessing: true } : v
        ),
      };
    case EditorActionType.GENERATE_PREVIEW_END:
      return {
        ...state,
        audios: state.audios.map((v, i) =>
          i === action.payload.slideIndex
            ? {
                ...v,
                data: action.payload.preview,
                isProcessing: false,
                timestamp: action.payload.preview ? Date.now() : v.timestamp,
              }
            : v
        ),
      };
    case EditorActionType.ERROR:
      return {
        ...state,
        error: {
          message: action.payload.error,
          id: state.error.id + 1,
        },
      };
    default:
      return state;
  }
}

function addTimestampToDataList<T>(
  data: T[],
  timestamp: number
): DataWithTimestamp<T>[] {
  return data.map((d) => ({ data: d, timestamp }));
}

export default function Editor({}: Props) {
  const { projectName } = useParams();

  const [state, dispatch] = useReducer(editorReducer, initialState);

  useEffect(() => {
    async function getProject() {
      try {
        const project = await retrieveProject(projectName);
        dispatch({
          type: EditorActionType.LOADING_COMPLETE,
          payload: project,
        });
      } catch (error) {
        let message = "Unknown occured while retrieving project";
        if (error instanceof Error) {
          message = error.message;
        }
        dispatch({
          type: EditorActionType.LOADING_FAILURE,
          payload: { error: message },
        });
      }
    }
    getProject();
  }, []);

  const onNotesChange = (notes: string) =>
    dispatch({ type: EditorActionType.NOTES_CHANGE, payload: { notes } });
  const onFocusChange = (focus: number) =>
    dispatch({ type: EditorActionType.FOCUS_CHANGE, payload: { focus } });
  const onFocusInc = () => dispatch({ type: EditorActionType.FOCUS_INC });
  const onFocusDec = () => dispatch({ type: EditorActionType.FOCUS_DEC });

  const processAndDownload = async () => {
    if (!projectName || state.isDownloading) return;
    try {
      dispatch({ type: EditorActionType.DOWNLOAD_INIT });
      const success = await saveProject();
      if (success) {
        await elaborateProject(projectName);
        await downloadProject(projectName);
      }
    } catch (error) {
      let message = "Unknown error occured while processing project";
      if (error instanceof AxiosError) {
        message = error.response
          ? JSON.stringify(error.response.data)
          : message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      dispatch({
        type: EditorActionType.ERROR,
        payload: { error: message },
      });
    }
    dispatch({ type: EditorActionType.DOWNLOAD_END });
  };

  const saveProject = async () => {
    if (!projectName || !state.projectZip || state.isSaving) return;
    try {
      dispatch({ type: EditorActionType.SAVE_INIT });
      const notesContent = state.notes.map((v) => v.data);
      const updatedProjectBlob = await buildProject(
        state.projectZip,
        notesContent
      );
      const file = new File(
        [updatedProjectBlob],
        `${encodeURI(projectName)}.pptx`
      );

      const fd = new FormData();
      fd.append("file", file);
      fd.append("projectName", projectName);
      await axios.post("/v1/public/upload", fd);
      dispatch({ type: EditorActionType.SAVE_END, payload: { success: true } });
      return true;
    } catch (error) {
      let message = "Unknown error occured while saving project";
      if (error instanceof AxiosError) {
        message = error.response
          ? JSON.stringify(error.response.data)
          : message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      dispatch({
        type: EditorActionType.ERROR,
        payload: { error: message },
      });
      dispatch({
        type: EditorActionType.SAVE_END,
        payload: { success: false },
      });
      return false;
    }
  };

  const isLoading = state.projectZip == null;

  return (
    <Container>
      <Header
        projectName={projectName}
        onDownload={processAndDownload}
        loadingDownload={state.isDownloading}
        onSave={saveProject}
        loadingSave={state.isSaving}
        hasUnsavedChanges={state.hasUnsavedChanges}
        loadingProject={isLoading}
      />
      {state.unrepairableError ? (
        <WidgetConainer>
          <FatalErrorContainer>
            <H2>Something went wrong.</H2>
            <P>{state.unrepairableError}</P>
          </FatalErrorContainer>
        </WidgetConainer>
      ) : isLoading ? (
        <WidgetConainer>
          <LoadingWidget />
        </WidgetConainer>
      ) : (
        <EditorContainer>
          <EditorSideBar
            slidePreviews={state.slides}
            focus={state.slideFocus}
            onFocus={onFocusChange}
          />
          <SlideEditor
            dispatch={dispatch}
            slideNumber={state.slideFocus + 1}
            lastSlideNumber={state.notes.length}
            goNextSlide={onFocusInc}
            goPreviousSlide={onFocusDec}
            notes={state.notes[state.slideFocus]}
            onChange={onNotesChange}
            audioPreview={state.audios[state.slideFocus]}
            slidePreview={state.slides[state.slideFocus]}
            error={state.error}
          />
        </EditorContainer>
      )}
    </Container>
  );
}

const FatalErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
`;

const WidgetConainer = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
`;

const EditorContainer = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: 1fr;
  flex: 1;
  overflow: hidden;
`;
