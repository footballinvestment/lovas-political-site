"use client";

import { useState } from "react";

export default function ApiTestPage() {
  const [testResult, setTestResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runTests = async () => {
    setLoading(true);
    setTestResult([]);
    setError("");

    try {
      // 1. GET /api/posts teszt
      console.log("Testing GET /api/posts...");
      const getResponse = await fetch("/api/posts");
      const posts = await getResponse.json();
      setTestResult((prev) => [
        ...prev,
        {
          name: "GET /api/posts",
          status: getResponse.ok ? "Success" : "Failed",
          data: posts,
        },
      ]);

      // 2. POST /api/posts teszt
      console.log("Testing POST /api/posts...");
      const postResponse = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Teszt Bejegyzés",
          content: "Ez egy teszt bejegyzés tartama.",
          status: "DRAFT",
        }),
      });
      const newPost = await postResponse.json();
      setTestResult((prev) => [
        ...prev,
        {
          name: "POST /api/posts",
          status: postResponse.ok ? "Success" : "Failed",
          data: newPost,
        },
      ]);

      if (newPost.id) {
        // 3. GET /api/posts/[id] teszt
        console.log(`Testing GET /api/posts/${newPost.id}...`);
        const getByIdResponse = await fetch(`/api/posts/${newPost.id}`);
        const postById = await getByIdResponse.json();
        setTestResult((prev) => [
          ...prev,
          {
            name: "GET /api/posts/[id]",
            status: getByIdResponse.ok ? "Success" : "Failed",
            data: postById,
          },
        ]);

        // 4. PUT /api/posts/[id] teszt
        console.log(`Testing PUT /api/posts/${newPost.id}...`);
        const putResponse = await fetch(`/api/posts/${newPost.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: "Módosított Teszt Bejegyzés",
            content: "Ez egy módosított teszt bejegyzés tartama.",
            status: "PUBLISHED",
          }),
        });
        const updatedPost = await putResponse.json();
        setTestResult((prev) => [
          ...prev,
          {
            name: "PUT /api/posts/[id]",
            status: putResponse.ok ? "Success" : "Failed",
            data: updatedPost,
          },
        ]);

        // 5. DELETE /api/posts/[id] teszt
        console.log(`Testing DELETE /api/posts/${newPost.id}...`);
        const deleteResponse = await fetch(`/api/posts/${newPost.id}`, {
          method: "DELETE",
        });
        const deleteResult = await deleteResponse.json();
        setTestResult((prev) => [
          ...prev,
          {
            name: "DELETE /api/posts/[id]",
            status: deleteResponse.ok ? "Success" : "Failed",
            data: deleteResult,
          },
        ]);
      }
    } catch (err) {
      console.error("Test error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6">API Tesztelés</h1>

          <button
            onClick={runTests}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {loading ? "Tesztelés..." : "Tesztek futtatása"}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="mt-8 space-y-4">
            {testResult.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">{result.name}</h3>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      result.status === "Success"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {result.status}
                  </span>
                </div>
                <pre className="bg-gray-50 p-2 rounded text-sm overflow-x-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
