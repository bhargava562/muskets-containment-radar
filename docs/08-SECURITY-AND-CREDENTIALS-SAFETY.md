# 08 — Security and Credentials Safety Verification

## Status: Audited and Verified Secure

---

## Overview

As part of the operational checklist for the Muskets project, this document records the security audit verifying that sensitive credentials are not hardcoded in the codebase, and that environment-specific local files are safely excluded from version control via `.gitignore`.

---

## 1. Credentials Isolation Analysis

The primary sensitive credentials in the Muskets platform are the API keys used by the AI Copilot to interact with external LLM models (e.g., `GEMINI_API_KEY` for Google Gemini, or `GROQ_API_KEY` for Groq).

### Dynamic Resolution Mechanism
We have verified that no API keys are hardcoded inside the Java codebase:
- In [GeminiAiClientImpl.java](file:///d:/IOB/backend/src/main/java/com/muskets/backend/investigation/ai/GeminiAiClientImpl.java) and [GroqAiClientImpl.java](file:///d:/IOB/backend/src/main/java/com/muskets/backend/investigation/ai/GroqAiClientImpl.java), keys are retrieved dynamically via `config.getAi().getApiKey()`.
- The configuration properties are managed by Spring's `@ConfigurationProperties` mapping in [InvestigationConfig.java](file:///d:/IOB/backend/src/main/java/com/muskets/backend/investigation/InvestigationConfig.java).
- In [application.yaml](file:///d:/IOB/backend/src/main/resources/application.yaml), the properties are dynamically resolved using Spring placeholder expressions:
  ```yaml
  app:
    ai:
      provider: ${AI_PROVIDER:groq}
      api-key: ${GROQ_API_KEY:${AI_API_KEY:MOCK_KEY}}
      model: ${AI_MODEL:llama-3.1-8b-instant}
  ```
- This configuration ensures that if no environment variable is provided, the application falls back safely to `MOCK_KEY` and leverages the [MockAiEvaluator.java](file:///d:/IOB/backend/src/main/java/com/muskets/backend/investigation/ai/MockAiEvaluator.java) instead of crashing or leaking keys.

---

## 2. Git Exclusion Verification (`.gitignore`)

The root [.gitignore](file:///d:/IOB/.gitignore) has been audited to confirm that local settings, environment files, and dataset secrets are properly excluded from version control. 

### Ignored Files & Folders
The following files are verified to be correctly listed in `.gitignore` and untracked by Git:

1. **Local Environment Files**:
   - `backend/.env` (Stores active `GROQ_API_KEY` / `GEMINI_API_KEY`)
   - `frontend/.env` (Stores active `VITE_BACKEND_URL`)
   - General patterns: `.env` and `.env.*`

2. **Secret Transaction / Customer Datasets**:
   - `backend/src/main/resources/sample_mule_account_data.csv` (Traced mule bank accounts list, excluded via `**/*sample_mule_account_data.csv` pattern)

3. **Persistent Local Database**:
   - `data/` and `**/data/muskets*` (Contains H2 database files in file mode)

4. **Build & Package Artifacts**:
   - `target/` and `**/target/` (Maven build compilation directory)
   - `node_modules/` and `**/node_modules/` (Node dependencies)
   - `dist/` and `**/dist/` (React build compilation output)

### Verification Command Logs
To double-check if any git-ignored files were accidentally tracked, we ran:
```bash
# Check status of ignored files
git status --ignored
```
*Output confirmed that `backend/.env`, `frontend/.env`, `sample_mule_account_data.csv`, and local `data/` database files are listed exclusively under the "Ignored files" section.*

---

## 3. Best Practices for Developers

To run the application locally with a live AI model:
1. Create a `.env` file in the `backend/` directory.
2. Define the key: `GROQ_API_KEY=your_actual_groq_api_key_here` (or `GEMINI_API_KEY` if using Gemini).
3. The Docker Compose configuration in [docker-compose.yml](file:///d:/IOB/docker-compose.yml) loads the `.env` file automatically via the `env_file` property, passing it safely into the container without exposing it in repository files.

