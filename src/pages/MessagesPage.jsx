import { useEffect, useMemo, useState } from "react";
import ChatSidebar from "../components/chat/ChatSidebar";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import ChatWindow from "../components/chat/ChatWindow";
import api from "../lib/axios";
import { useClinicStore } from "../store/useClinicStore";

const normalizeId = (id) => String(id || "").trim().toLowerCase();

const normalizeClients = (responseData) => {
  if (!responseData) return [];

  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.data)) return responseData.data;
  if (Array.isArray(responseData?.clients)) return responseData.clients;
  if (Array.isArray(responseData?.data?.clients)) return responseData.data.clients;
  if (Array.isArray(responseData?.result)) return responseData.result;
  if (Array.isArray(responseData?.data?.result)) return responseData.data.result;

  if (responseData?.id || responseData?.email) return [responseData];
  if (responseData?.data?.id || responseData?.data?.email) {
    return [responseData.data];
  }

  return [];
};

const buildClientMap = (clients) => {
  const map = {};

  clients.forEach((client) => {
    const ids = [
      client.id,
      client.userId,
      client.clientId,
      client.accountId,
      client.applicationUserId,
      client.identityUserId,
      client.user?.id,
      client.user?.userId,
      client.user?.applicationUserId,
      client.userInfo?.id,
      client.profile?.id,
    ].filter(Boolean);

    ids.forEach((id) => {
      map[normalizeId(id)] = client;
    });
  });

  return map;
};

const mergeClientsById = (clients) => {
  const map = new Map();

  clients.forEach((client) => {
    if (!client?.id) return;

    const key = normalizeId(client.id);
    const existing = map.get(key);

    map.set(key, {
      ...existing,
      ...client,
    });
  });

  return Array.from(map.values());
};

const MessagesPage = () => {
  const selectedClinic = useClinicStore((state) => state.selectedClinic);

  const clinicId = selectedClinic?.id || selectedClinic?.clinicId;
  const [liveMessage, setLiveMessage] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [clients, setClients] = useState([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [hasLoadedClients, setHasLoadedClients] = useState(false);
  const [inboxRefreshKey, setInboxRefreshKey] = useState(0);

  const clientMap = useMemo(() => {
    return buildClientMap(clients);
  }, [clients]);

  useEffect(() => {
    const fetchClients = async () => {
      if (!clinicId) {
        setClients([]);
        setHasLoadedClients(true);
        return;
      }

      setIsLoadingClients(true);
      setHasLoadedClients(false);

      try {
        const [fullRes, softRes] = await Promise.allSettled([
          api.get(`/clinic/${clinicId}/clients/full`),
          api.get(`/clinic/${clinicId}/clients/soft`),
        ]);

        let allClients = [];

        if (fullRes.status === "fulfilled") {
          console.log("CHAT /clients/full RAW:", fullRes.value.data);
          allClients.push(...normalizeClients(fullRes.value.data));
        } else {
          console.log(
            "CHAT /clients/full ERROR:",
            fullRes.reason?.response?.data || fullRes.reason?.message
          );
        }

        if (softRes.status === "fulfilled") {
          console.log("CHAT /clients/soft RAW:", softRes.value.data);
          allClients.push(...normalizeClients(softRes.value.data));
        } else {
          console.log(
            "CHAT /clients/soft ERROR:",
            softRes.reason?.response?.data || softRes.reason?.message
          );
        }

        const mergedClients = mergeClientsById(allClients);

        console.log("CHAT MERGED CLIENTS:", mergedClients);

        setClients(mergedClients);
      } catch (error) {
        console.log(
          "FETCH CHAT CLIENTS ERROR:",
          error.response?.data || error.message
        );

        setClients([]);
      } finally {
        setIsLoadingClients(false);
        setHasLoadedClients(true);
      }
    };

    fetchClients();
  }, [clinicId]);
useEffect(() => {
  const token = localStorage.getItem("petzy_access_token");

  if (!token) return;

  let isCancelled = false;

  const apiBaseUrl = api.defaults.baseURL || "";
  const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, "");

  const connection = new HubConnectionBuilder()
    .withUrl(`${apiOrigin}/hubs/chat`, {
      accessTokenFactory: () =>
        localStorage.getItem("petzy_access_token") || "",
      withCredentials: false,
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Information)
    .build();

  connection.on("ReceiveMessage", (message) => {
    if (isCancelled) return;

    const receivedMessage = message?.data ?? message;

    console.log("SIGNALR RECEIVE MESSAGE:", receivedMessage);

    if (!receivedMessage?.conversationId) return;

    setLiveMessage({
      ...receivedMessage,
      __receivedAt: Date.now(),
    });

    window.dispatchEvent(new Event("petzy:inbox-updated"));

    setInboxRefreshKey((key) => key + 1);
  });

  const startConnection = async () => {
    try {
      await connection.start();

      if (isCancelled) {
        await connection.stop();
        return;
      }

      console.log("SIGNALR CHAT CONNECTED");
    } catch (error) {
      const message = error?.message || String(error);

      const isExpectedAbort =
        isCancelled ||
        error?.name === "AbortError" ||
        message.includes("stopped during negotiation") ||
        message.includes("The connection was stopped during negotiation");

      if (isExpectedAbort) {
        console.log("SIGNALR CHAT CONNECTION STOPPED DURING CLEANUP:", message);
        return;
      }

      console.log("SIGNALR CHAT CONNECTION ERROR:", error);
    }
  };

  startConnection();

  return () => {
    isCancelled = true;

    connection.off("ReceiveMessage");

    connection.stop().catch((error) => {
      const message = error?.message || String(error);

      const isExpectedStopError =
        error?.name === "AbortError" ||
        message.includes("stopped during negotiation") ||
        message.includes("The connection was stopped during negotiation");

      if (isExpectedStopError) {
        console.log("SIGNALR CHAT STOPPED DURING CLEANUP:", message);
        return;
      }

      console.log("SIGNALR CHAT STOP ERROR:", error);
    });
  };
}, []);
  return (
    <div className="flex h-[88vh] bg-base-100 text-base-content overflow-hidden">
      <div className="w-[420px] min-w-[390px] max-w-[440px] h-full border-r border-base-300 bg-base-100">
        <ChatSidebar
        selectedChat={selectedChat}
        setSelectedChat={setSelectedChat}
        clientMap={clientMap}
        isLoadingClients={isLoadingClients}
        hasLoadedClients={hasLoadedClients}
        liveMessage={liveMessage}
        refreshKey={inboxRefreshKey}
      />
      </div>

      <div className="flex-1 h-full bg-base-100 min-w-0">
        <ChatWindow
        selectedChat={selectedChat}
        liveMessage={liveMessage}
        onMessageSent={(message) => {
          setLiveMessage({
            ...message,
            __receivedAt: Date.now(),
          });

          setInboxRefreshKey((key) => key + 1);
        }}
      />
      </div>
    </div>
  );
};

export default MessagesPage;