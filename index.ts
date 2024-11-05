import { Hocuspocus } from "@hocuspocus/server";
import { Logger } from "@hocuspocus/extension-logger";
import { Database } from "@hocuspocus/extension-database";
import { createClient } from "@supabase/supabase-js";
import { TiptapTransformer } from "@hocuspocus/transformer";
import { generateHTML } from "@tiptap/html";
import dotenv from "dotenv";
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
          return data?.content || null;
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
  // You can also access the fetched data in other hooks
  // async onLoadDocument({ document, context, documentName }) {
  //   // The document is already initialized with data from fetch
  //   console.log("Document loaded:", documentName);

  //   const { data, error } = await supabase
  //     .from("documents")
  //     .select("content")
  //     .match({ id: documentName })
  //     .single();

  //   const json = generateJSON(data?.content, extensions);

  //   const ydoc = TiptapTransformer.toYdoc(
  //     // the actual JSON
  //     json,
  //     // the `field` you’re using in Tiptap. If you don’t know what that is, use 'default'.
  //     "default",
  //     // The Tiptap extensions you’re using. Those are important to create a valid schema.
  //     extensions
  //   );

  //   return ydoc;
  // },
  // async onStoreDocument(props) {
  //   console.log("onStoreDocument triggered");
  // console.log({ props });
  // },
});

// … and run it!
server.listen();
