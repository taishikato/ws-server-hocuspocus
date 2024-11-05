import { Hocuspocus } from "@hocuspocus/server";
import { Logger } from "@hocuspocus/extension-logger";
import { Database } from "@hocuspocus/extension-database";
import { createClient } from "@supabase/supabase-js";
import { TiptapTransformer } from "@hocuspocus/transformer";
import { generateHTML, generateJSON } from "@tiptap/html";
import dotenv from "dotenv";
import * as Y from "yjs";
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
  async onChange(data) {
    console.log("onChange!");
  },
  extensions: [
    new Logger(),
    new Database({
      //   // Called when a document is first loaded
      fetch: async (props) => {
        try {
          const { data, error } = await supabase
            .from("documents")
            .select("content")
            .match({ id: props.documentName })
            .single();

          console.log({ data });

          if (error) throw error;

          const json = generateJSON(data.content, extensions);
          console.log("Converted JSON:", json);

          return Y.encodeStateAsUpdate(
            TiptapTransformer.toYdoc(json, "default", extensions)
          );
        } catch (error) {
          console.error("Error fetching document:", error);
          return null;
        }
      },
      store: async (props) => {
        console.log("inside store");
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

server.listen();
