import express from "express";
import expressWebsockets from "express-ws";
import dotenv from "dotenv";
import * as Y from "yjs";
import { Hocuspocus } from "@hocuspocus/server";
import { Logger } from "@hocuspocus/extension-logger";
import { Database } from "@hocuspocus/extension-database";
import { createClient } from "@supabase/supabase-js";
import { TiptapTransformer } from "@hocuspocus/transformer";
import { generateHTML, generateJSON } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import CharacterCount from "@tiptap/extension-character-count";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import ListKeymap from "@tiptap/extension-list-keymap";
import Placeholder from "@tiptap/extension-placeholder";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import Typography from "@tiptap/extension-typography";

dotenv.config();

const extensions = [
  StarterKit,
  Collaboration,
  CharacterCount,
  CollaborationCursor,
  Highlight,
  Image,
  Link,
  ListKeymap,
  Placeholder,
  Table,
  TableCell,
  TableHeader,
  TableRow,
  Typography,
];

// Supabase client configuration
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configure the server …
const server = new Hocuspocus({
  port: 1234,
  // Handle connection
  async onConnect(data) {
    console.log("Client connected:", data.context);
  },
  // Handle disconnection
  async onDisconnect(data) {
    console.log("Client disconnected:", data.context);
  },
  async onAuthenticate(data) {
    const { token } = data;

    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData.user) {
      throw new Error("Not authorized!");
    }
  },
  extensions: [
    new Logger(),
    new Database({
      // Called when a document is first loaded
      fetch: async (props) => {
        try {
          const { data, error } = await supabase
            .from("documents")
            .select("content")
            .match({ id: props.documentName })
            .single();

          if (error) throw error;

          const json = generateJSON(data.content, extensions);

          return Y.encodeStateAsUpdate(
            TiptapTransformer.toYdoc(json, "default", extensions)
          );
        } catch (error) {
          console.error("Error fetching document:", error);
          return null;
        }
      },
      store: async (props) => {
        // Convert Y.doc state to JSON first
        const json = TiptapTransformer.fromYdoc(props.document, "default");

        // Then convert JSON to HTML
        const html = generateHTML(json, extensions);

        const { error } = await supabase
          .from("documents")
          .update({ content: html })
          .match({ id: props.documentName })
          .single();
      },
    }),
  ],
});

// Setup your express instance using the express-ws extension
const { app } = expressWebsockets(express());

// A basic http route
app.get("/", (request, response) => {
  response.send("Hello World!");
});

// Add a websocket route for Hocuspocus
// You can set any contextual data like in the onConnect hook
// and pass it to the handleConnection method.
app.ws("/collaboration", (websocket, request) => {
  // example context
  const context = {
    user: {
      id: 1234,
      name: "Jane",
    },
  };

  server.handleConnection(websocket, request, context);
});

// Start the server
app.listen(1234, () => console.log("Listening on http://127.0.0.1:1234"));
