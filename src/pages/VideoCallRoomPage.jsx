import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  Video,
  VideoOff,
} from "lucide-react";
import toast from "react-hot-toast";

import { AzureCommunicationTokenCredential } from "@azure/communication-common";
import {
  CallClient,
  LocalVideoStream,
  VideoStreamRenderer,
} from "@azure/communication-calling";

import api from "../lib/axios";
import VisitSummaryForm from "../components/VisitSummaryForm";
const unwrapResponse = (responseData) => {
  return responseData?.data ?? responseData ?? {};
};
const safeString = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const normalizeVisitSummaryPayload = (payload) => {
  const diagnosisStatus = safeString(payload.diagnosisStatus);

  return {
    petId: payload.petId,
    clinicId: payload.clinicId,
    appointmentId: payload.appointmentId,

    mainReasonForVisit: safeString(payload.mainReasonForVisit),
    diagnosisStatus,
    diagnosis:
      diagnosisStatus === "Healthy / normal findings"
        ? ""
        : safeString(payload.diagnosis),

    treatment: safeString(
      Array.isArray(payload.treatment)
        ? payload.treatment.join(", ")
        : payload.treatment
    ),

    medicinesGiven: safeString(
      Array.isArray(payload.medicinesGiven)
        ? payload.medicinesGiven.join(", ")
        : payload.medicinesGiven
    ),

    followUpInstructions: safeString(payload.followUpInstructions),
    notes: safeString(payload.notes),

    isCreatedByClinic: true,
  };
};
const EndCallConfirmModal = ({ isOpen, isEnding, onCancel, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="bg-base-100 border border-base-300 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-semibold text-base-content">
              End video call?
            </h3>
            <p className="text-sm text-base-content/70 mt-1">
              This will close the current call session for this appointment.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="btn btn-ghost btn-sm btn-circle"
            disabled={isEnding}
          >
            ×
          </button>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="btn btn-outline rounded-xl"
            onClick={onCancel}
            disabled={isEnding}
          >
            Stay in Call
          </button>

          <button
            type="button"
            className="btn btn-error rounded-xl flex items-center gap-2"
            onClick={onConfirm}
            disabled={isEnding}
          >
            <PhoneOff size={16} />
            {isEnding ? "Ending..." : "End Call"}
          </button>
        </div>
      </div>
    </div>
  );
};
const VideoCallRoomPage = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const appointment = location.state?.appointment || null;
  const initialVideoCallData = location.state?.videoCallData || null;
  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef(null);
  const hasStartedJoinRef = useRef(false);
  const callRef = useRef(null);
  const callAgentRef = useRef(null);
  const deviceManagerRef = useRef(null);
  const localVideoStreamRef = useRef(null);
  const desiredMutedRef = useRef(false);
  const pendingCameraStartRef = useRef(false);
  const localRendererRef = useRef(null);
  const localViewRef = useRef(null);
  const remoteRenderersRef = useRef({});
  const [localVideoStream, setLocalVideoStream] = useState(null);
  const [remoteVideoCount, setRemoteVideoCount] = useState(0);
  const [joinData, setJoinData] = useState(null);
  const [callState, setCallState] = useState("Connecting");
  const [isJoining, setIsJoining] = useState(true);
  const [isEnding, setIsEnding] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicToggling, setIsMicToggling] = useState(false);
  const [isCameraToggling, setIsCameraToggling] = useState(false);
  const [isCameraSending, setIsCameraSending] = useState(false);
  const [isEndCallModalOpen, setIsEndCallModalOpen] = useState(false);
  const [isVisitSummaryOpen, setIsVisitSummaryOpen] = useState(false);
  const [isSavingVisitSummary, setIsSavingVisitSummary] = useState(false);
  const clearLocalVideo = () => {
    safeDispose(localViewRef.current);
    safeDispose(localRendererRef.current);

    localViewRef.current = null;
    localRendererRef.current = null;

    if (localVideoRef.current) {
        localVideoRef.current.innerHTML = "";
    }
    };

 const clearRemoteVideos = () => {
  Object.values(remoteRenderersRef.current).forEach(({ view, renderer }) => {
    safeDispose(view);
    safeDispose(renderer);
  });

  remoteRenderersRef.current = {};

  if (remoteVideosRef.current) {
    remoteVideosRef.current.innerHTML = "";
  }

  setRemoteVideoCount(0);
};

  const renderLocalVideo = async (localVideoStream) => {
    if (!localVideoRef.current || !localVideoStream) return;

    clearLocalVideo();

    const renderer = new VideoStreamRenderer(localVideoStream);
    const view = await renderer.createView();
    view.target.style.width = "100%";
    view.target.style.height = "100%";
    localRendererRef.current = renderer;
    localViewRef.current = view;

    localVideoRef.current.appendChild(view.target);
  };
  useEffect(() => {
  if (isJoining || !localVideoStream) return;

  const renderPreview = async () => {
    try {
      await renderLocalVideo(localVideoStream);
    } catch (error) {
      console.log("LOCAL VIDEO PREVIEW ERROR:", error);
    }
  };

  renderPreview();
}, [isJoining, localVideoStream]);
  const renderRemoteVideoStream = async (remoteVideoStream) => {
    if (!remoteVideosRef.current || !remoteVideoStream?.isAvailable) return;

    const streamKey = remoteVideoStream.id;

    if (remoteRenderersRef.current[streamKey]) return;

    const renderer = new VideoStreamRenderer(remoteVideoStream);
    const view = await renderer.createView();

    remoteRenderersRef.current[streamKey] = {
      renderer,
      view,
    };

    view.target.style.width = "100%";
    view.target.style.height = "100%";

    const wrapper = document.createElement("div");
    wrapper.className =
      "rounded-2xl overflow-hidden bg-black min-h-[560px] h-full border border-base-300 shadow-sm";
    wrapper.dataset.streamKey = streamKey;
    wrapper.appendChild(view.target);

    remoteVideosRef.current.appendChild(wrapper);

    setRemoteVideoCount(Object.keys(remoteRenderersRef.current).length);
  };

  const removeRemoteVideoStream = (remoteVideoStream) => {
    const streamKey = remoteVideoStream.id;
    const rendererData = remoteRenderersRef.current[streamKey];

    if (rendererData?.view) rendererData.view.dispose();
    if (rendererData?.renderer) rendererData.renderer.dispose();

    delete remoteRenderersRef.current[streamKey];

    const wrapper = remoteVideosRef.current?.querySelector(
      `[data-stream-key="${streamKey}"]`
    );

    if (wrapper) wrapper.remove();
    setRemoteVideoCount(Object.keys(remoteRenderersRef.current).length);
  };

  const subscribeToRemoteParticipant = (participant) => {
    participant.videoStreams.forEach((remoteVideoStream) => {
      renderRemoteVideoStream(remoteVideoStream);

      remoteVideoStream.on("isAvailableChanged", () => {
        if (remoteVideoStream.isAvailable) {
          renderRemoteVideoStream(remoteVideoStream);
        } else {
          removeRemoteVideoStream(remoteVideoStream);
        }
      });
    });

    participant.on("videoStreamsUpdated", (event) => {
      event.added.forEach((remoteVideoStream) => {
        remoteVideoStream.on("isAvailableChanged", () => {
          if (remoteVideoStream.isAvailable) {
            renderRemoteVideoStream(remoteVideoStream);
          } else {
            removeRemoteVideoStream(remoteVideoStream);
          }
        });

        renderRemoteVideoStream(remoteVideoStream);
      });

      event.removed.forEach(removeRemoteVideoStream);
    });
  };
const canUseCall = (call) => {
  return call && call.state !== "Disconnected" && call.state !== "Disconnecting";
};

const applyDesiredMicState = async () => {
  const call = callRef.current;

  if (!canUseCall(call)) return;

  try {
    if (desiredMutedRef.current && !call.isMuted) {
      await call.mute();
    }

    if (!desiredMutedRef.current && call.isMuted) {
      await call.unmute();
    }

    setIsMuted(Boolean(call.isMuted));
  } catch (error) {
    console.log("APPLY MIC STATE ERROR:", error);
  }
};

const trySendLocalVideoToCall = async () => {
  const call = callRef.current;
  const stream = localVideoStreamRef.current;

  if (!canUseCall(call) || !stream) return false;

  try {
    const alreadySending = call.localVideoStreams?.length > 0;

    if (!alreadySending) {
      await call.startVideo(stream);
    }

    pendingCameraStartRef.current = false;
    setIsCameraSending(true);

    return true;
  } catch (error) {
    console.log("START VIDEO SEND ERROR:", error);

    pendingCameraStartRef.current = true;
    setIsCameraSending(false);

    return false;
  }
};
  useEffect(() => {
    const joinCall = async () => {
      if (!appointmentId) return;
      if (hasStartedJoinRef.current) return;
      hasStartedJoinRef.current = true;  
      setIsJoining(true);

      try {
        let data = initialVideoCallData ? unwrapResponse(initialVideoCallData) : null;
        if (data?.roomId && data?.token) {
        console.log("VIDEO CALL START DATA USED IN ROOM:", {
            roomId: data.roomId,
            hasToken: Boolean(data.token),
        });
        } else {
        const res = await api.get(`/videocall/${appointmentId}/join`);

        console.log("VIDEO CALL JOIN RESPONSE:", {
            roomId: res.data?.roomId,
            hasToken: Boolean(res.data?.token),
        });

        data = unwrapResponse(res.data);
        }

        setJoinData(data);

        if (!data?.token || !data?.roomId) {
          toast.error("Video call response is missing token or roomId");
          setIsJoining(false);
          return;
        }

        const callClient = new CallClient();
        const credential = new AzureCommunicationTokenCredential(data.token);

        const callAgent = await callClient.createCallAgent(credential, {
          displayName: "Clinic",
        });

        const deviceManager = await callClient.getDeviceManager();

        await deviceManager.askDevicePermission({
        audio: true,
        video: true,
        });

        const cameras = await deviceManager.getCameras();
        const selectedCamera = cameras[0] || null;

        const initialLocalVideoStream = selectedCamera
        ? new LocalVideoStream(selectedCamera)
        : null;

        localVideoStreamRef.current = initialLocalVideoStream;
        setLocalVideoStream(initialLocalVideoStream);

        callAgentRef.current = callAgent;
        deviceManagerRef.current = deviceManager;

        const callOptions = initialLocalVideoStream
        ? {
            videoOptions: {
                localVideoStreams: [initialLocalVideoStream],
            },
            }
        : undefined;

        // Important: working demo uses groupId, not roomId
        const call = callAgent.join(
        {
            groupId: data.roomId,
        },
        callOptions
        );

        console.log("ACS JOIN CALLED WITH:", {
        groupId: data.roomId,
        hasToken: Boolean(data.token),
        hasInitialCamera: Boolean(initialLocalVideoStream),
        initialState: call.state,
        initialEndReason: call.callEndReason,
        });

        callRef.current = call;

        if (initialLocalVideoStream) {
        await renderLocalVideo(initialLocalVideoStream);
        setIsCameraOn(true);
        setIsCameraSending(true);
        } else {
        setIsCameraOn(false);
        setIsCameraSending(false);
        }

        setCallState(call.state || "Connecting");
        setIsMuted(Boolean(call.isMuted));

        call.on("isMutedChanged", () => {
        setIsMuted(Boolean(call.isMuted));
        });

        call.on("stateChanged", async () => {
        console.log("ACS CALL STATE:", call.state);
        console.log("ACS CALL END REASON RAW:", call.callEndReason);

        setCallState(call.state);

        if (call.state === "Disconnected") {
            const reason = call.callEndReason;

            console.log("ACS DISCONNECTED DETAILS:", {
            code: reason?.code,
            subCode: reason?.subCode,
            message: reason?.message,
            resultCategories: reason?.resultCategories,
            });

            toast.error(
            `Call disconnected${
                reason?.code ? ` - Code: ${reason.code}` : ""
            }${reason?.subCode ? ` / ${reason.subCode}` : ""}`
            );

            return;
        }

        await applyDesiredMicState();

        if (pendingCameraStartRef.current && localVideoStreamRef.current) {
            await trySendLocalVideoToCall();
        }
        });

        call.remoteParticipants.forEach(subscribeToRemoteParticipant);

        call.on("remoteParticipantsUpdated", (event) => {
          event.added.forEach(subscribeToRemoteParticipant);
        });
      } catch (error) {
        console.log("JOIN VIDEO CALL ERROR:", error.response?.data || error.message);
        toast.error("Failed to join video call");
      } finally {
        setIsJoining(false);
      }
    };

    joinCall();

    return () => {
        hasStartedJoinRef.current = false;

        clearLocalVideo();
        clearRemoteVideos();

        if (
            callRef.current &&
            callRef.current.state !== "Disconnected" &&
            callRef.current.state !== "Disconnecting"
        ) {
            callRef.current.hangUp().catch(() => {});
        }

        callRef.current = null;

        safeDispose(callAgentRef.current);
        callAgentRef.current = null;

        deviceManagerRef.current = null;
        localVideoStreamRef.current = null;
        };
  }, [appointmentId]);

 const handleToggleMute = async () => {
  const call = callRef.current;
  const deviceManager = deviceManagerRef.current;

  if (!call || !deviceManager) {
    toast.error("Call is not ready yet");
    return;
  }

  setIsMicToggling(true);

  const nextMutedState = !isMuted;

  desiredMutedRef.current = nextMutedState;
  setIsMuted(nextMutedState);

  try {
    await deviceManager.askDevicePermission({
      audio: true,
    });

    await applyDesiredMicState();
  } catch (error) {
    console.log("MUTE TOGGLE ERROR:", error);
    toast.error("Could not update microphone. Check microphone permission.");
  } finally {
    setIsMicToggling(false);
  }
};

const handleToggleCamera = async () => {
  const call = callRef.current;
  const deviceManager = deviceManagerRef.current;

  if (!call || !deviceManager) {
    toast.error("Call is not ready yet");
    return;
  }

  setIsCameraToggling(true);

  try {
    const activeLocalVideoStream = call.localVideoStreams?.[0];

    if (isCameraOn || activeLocalVideoStream) {
      if (activeLocalVideoStream) {
        await call.stopVideo(activeLocalVideoStream).catch((error) => {
          const message = String(error?.message || "");

          if (!message.includes("video is already stopped")) {
            throw error;
          }
        });
      }

      pendingCameraStartRef.current = false;
      setIsCameraSending(false);

      clearLocalVideo();

      localVideoStreamRef.current = null;
      setLocalVideoStream(null);
      setIsCameraOn(false);

      return;
    }

    const permission = await deviceManager.askDevicePermission({
      video: true,
    });

    if (!permission?.video) {
      toast.error("Camera permission was not granted.");
      return;
    }

    const cameras = await deviceManager.getCameras();

    if (!cameras.length) {
      toast.error("No camera found.");
      return;
    }

    const newLocalVideoStream = new LocalVideoStream(cameras[0]);

    localVideoStreamRef.current = newLocalVideoStream;
    setLocalVideoStream(newLocalVideoStream);
    setIsCameraOn(true);

    const startedSending = await trySendLocalVideoToCall();

    if (!startedSending) {
      toast("Camera preview is on. It will publish when the call is ready.");
    }
  } catch (error) {
    console.log("CAMERA TOGGLE ERROR:", error);

    pendingCameraStartRef.current = false;
    setIsCameraSending(false);

    clearLocalVideo();

    localVideoStreamRef.current = null;
    setLocalVideoStream(null);
    setIsCameraOn(false);

    toast.error("Could not start camera. Check browser/system camera permissions.");
  } finally {
    setIsCameraToggling(false);
  }
};
const handleSubmitVisitSummary = async (payload) => {
  setIsSavingVisitSummary(true);

  const sanitizedPayload = normalizeVisitSummaryPayload(payload);

  try {
    console.log("VISIT SUMMARY PAYLOAD:", sanitizedPayload);

    if (
      !sanitizedPayload.petId ||
      !sanitizedPayload.clinicId ||
      !sanitizedPayload.appointmentId
    ) {
      toast.error("Missing appointment, clinic, or pet information.");
      return;
    }

    const medicalHistoryResponse = await api.post(
      "/medical-history",
      sanitizedPayload
    );

    console.log("CREATE MEDICAL HISTORY RESPONSE:", medicalHistoryResponse.data);

    const statusResponse = await api.put(
      `/appointment/${sanitizedPayload.appointmentId}/status`,
      {
        status: 3,
      }
    );

    console.log("COMPLETE APPOINTMENT RESPONSE:", statusResponse.data);

    toast.success("Medical history saved. Appointment completed.");

    setIsVisitSummaryOpen(false);
    navigate("/video-calls", { replace: true });
  } catch (error) {
    console.log("SAVE VISIT SUMMARY STATUS:", error.response?.status);
    console.log("SAVE VISIT SUMMARY DATA:", error.response?.data);
    console.log("SAVE VISIT SUMMARY PAYLOAD SENT:", sanitizedPayload);

    toast.error("Medical history was not saved. Appointment was not completed.");
  } finally {
    setIsSavingVisitSummary(false);
  }
};
const handleEndCall = async () => {
  if (!appointmentId) return;

  setIsEnding(true);
  setIsEndCallModalOpen(false);

  let backendEndFailed = false;

  try {
    try {
      const res = await api.post(`/videocall/${appointmentId}/end`);
      console.log("VIDEO CALL END RESPONSE:", res.data);
    } catch (error) {
      backendEndFailed = true;

      console.log(
        "END VIDEO CALL API ERROR:",
        error.response?.status,
        error.response?.data || error.message
      );
    }

    try {
      if (
        callRef.current &&
        callRef.current.state !== "Disconnected" &&
        callRef.current.state !== "Disconnecting"
      ) {
        await callRef.current.hangUp();
      }
    } catch (error) {
      console.log("LOCAL HANGUP ERROR:", error);
    }

    callRef.current = null;

    clearLocalVideo();
    clearRemoteVideos();

    safeDispose(callAgentRef.current);
    callAgentRef.current = null;

    deviceManagerRef.current = null;
    localVideoStreamRef.current = null;

    setLocalVideoStream(null);
    setIsCameraOn(false);
    setIsCameraSending(false);

    if (backendEndFailed) {
      toast("Call closed locally, but the server end request failed.");
    } else {
      toast.success("Video call ended successfully.");
    }

    setIsVisitSummaryOpen(true);
  } finally {
    setIsEnding(false);
  }
};
const safeDispose = (item) => {
  try {
    item?.dispose?.();
  } catch (error) {
    const message = String(error?.message || "");

    if (!message.includes("already disposed")) {
      console.log("SAFE DISPOSE ERROR:", error);
    }
  }
};
  return (
    <div className="min-h-screen bg-base-100 p-8 text-base-content">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-sm btn-ghost mb-3"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Video size={24} />
            Video Call
          </h1>

          <p className="text-sm text-base-content/70">
            Status:{" "}
            <span className="font-medium text-base-content">{callState}</span>
          </p>
        </div>

        <button
        type="button"
        onClick={() => setIsEndCallModalOpen(true)}
        className="btn btn-error rounded-xl flex items-center gap-2"
        disabled={isEnding}
        >
        <PhoneOff size={18} />
        {isEnding ? "Ending..." : "End Call"}
        </button>
      </div>

      {appointment && (
        <div className="bg-base-100 border border-base-300 rounded-2xl p-5 shadow-sm mb-6">
          <p className="text-sm text-base-content/60 mb-1">
            Appointment Context
          </p>
          <p className="font-medium text-base-content">
            {appointment.clientName || appointment.clientId || "Client"} •{" "}
            {appointment.petName || appointment.petId || "Pet"}
          </p>
        </div>
      )}

      <div className="bg-base-100 border border-base-300 rounded-2xl shadow-sm overflow-hidden">
        {isJoining ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="animate-spin text-primary mb-3" size={32} />
            <p className="text-sm text-base-content/70">
              Joining video call...
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-base-300">
              <div>
                <p className="font-medium text-base-content">
                  Room ID
                </p>
                <p className="text-sm text-base-content/60 break-all">
                  {joinData?.roomId || "No room found"}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                type="button"
                onClick={handleToggleMute}
                className={`btn btn-sm rounded-xl flex items-center gap-2 ${
                    isMuted ? "btn-error" : "btn-success"
                }`}
                disabled={isJoining || !callRef.current || isMicToggling}
                >
                {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                {isMicToggling ? "Updating..." : isMuted ? "Mic Off" : "Mic On"}
                </button>

                <button
                type="button"
                onClick={handleToggleCamera}
                className={`btn btn-sm rounded-xl flex items-center gap-2 ${
                    isCameraOn ? "btn-success" : "btn-outline"
                }`}
                disabled={isJoining || !callRef.current || isCameraToggling}
                >
                {isCameraOn ? <Video size={16} /> : <VideoOff size={16} />}
                {isCameraToggling
                    ? "Updating..."
                    : isCameraOn
                    ? isCameraSending
                    ? "Camera On"
                    : "Preview On"
                    : "Camera Off"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 p-4 min-h-[76vh] bg-base-200">
              {/* Client video - big */}
              <div className="xl:col-span-3 bg-base-300 rounded-2xl overflow-hidden border border-base-300 min-h-[620px] relative">
                <div className="absolute top-4 left-4 z-10 rounded-full bg-black/50 text-white text-xs px-3 py-1.5">
                  Client Video
                </div>

                <div
                  ref={remoteVideosRef}
                  className="h-full min-h-[620px] grid grid-cols-1 gap-4 p-4"
                />

                {remoteVideoCount === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-base-content/50">
                    <VideoOff size={34} className="mb-3 opacity-60" />
                    <p className="text-sm font-medium">Waiting for remote participant...</p>
                    <p className="text-xs text-base-content/40 mt-1">
                      The client video will appear here once they join.
                    </p>
                  </div>
                )}
              </div>

              {/* Your camera - small like before */}
              <div className="bg-base-300 rounded-2xl overflow-hidden border border-base-300 min-h-[260px] h-fit">
                <div className="p-3 border-b border-base-100/30">
                  <p className="text-sm font-medium text-base-content">
                    Your Camera
                  </p>
                </div>

                <div className="relative min-h-[220px] w-full bg-base-200 flex items-center justify-center overflow-hidden">
                  {!isCameraOn && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-base-content/50 text-sm">
                      <VideoOff size={28} className="mb-2" />
                      Camera is off
                    </div>
                  )}

                  <div
                    ref={localVideoRef}
                    className="w-full h-full min-h-[220px] flex items-center justify-center"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <EndCallConfirmModal
        isOpen={isEndCallModalOpen}
        isEnding={isEnding}
        onCancel={() => setIsEndCallModalOpen(false)}
        onConfirm={handleEndCall}
        />
        <VisitSummaryForm
        isOpen={isVisitSummaryOpen}
        appointment={appointment || { id: appointmentId }}
        isSubmitting={isSavingVisitSummary}
        onSubmit={handleSubmitVisitSummary}
        />
    </div>
  );
};

export default VideoCallRoomPage;