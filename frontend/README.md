# Intel Support Lens Dashboard - Frontend

## Overview

The Intel Support Lens Dashboard frontend provides a modern, intuitive user interface for interacting with the support knowledge base. It enables support agents to efficiently search for information and get AI-powered answers to customer queries without having to manually sift through extensive documentation.

## Technologies Used

- **React**: UI library for building component-based interfaces
- **TypeScript**: Type-safe JavaScript for improved developer experience
- **TailwindCSS**: Utility-first CSS framework for responsive design
- **shadcn/ui**: High-quality UI components built on Radix UI
- **React Router**: Navigation and routing for single-page application
- **React Query**: Data fetching, caching, and state management
- **Vite**: Next generation frontend tooling for fast development

## Key Components

### Layout & Navigation

The application uses a consistent layout with a sidebar navigation system that allows users to quickly access different features of the application. The responsive design ensures usability across different device sizes.

### Knowledge Base Chat

The Chat interface allows users to have natural language conversations with the AI. It features:

- Real-time message history
- Document citations with source tracking
- Context-aware responses from the knowledge base
- Support for markdown, CSV, and plain text rendering

### Search Documents

The Search Documents page enables direct semantic search of the knowledge base:

- Customizable search parameters
- Relevance scoring visualization
- Interactive document preview
- Multi-format content display

### Dashboard Analytics

The dashboard provides insight into system usage:

- Query volume metrics
- Top queried documents tracking
- LLM response performance stats
- Interactive data visualizations

### Document Upload

The application includes an intuitive document uploader that supports:

- Drag and drop functionality
- Multi-file uploads
- Progress tracking
- Format validation

## Development Approach

The frontend was built using a combination of:

1. **Base UI scaffolding** from lovable.dev to establish a clean, modern design system
2. **Component enhancement** through standard coding practices and modern React patterns
3. **GitHub Copilot** to accelerate development and implement best practices:
   - Using Copilot for generating consistent component structures
   - Implementing reusable hooks for data fetching
   - Creating type definitions for API responses
   - Building accessible UI components
   - Optimizing performance through proper state management

Copilot's agent mode was particularly helpful in developing the more complex interactive features like the chat interface and document viewer, which required careful state management and formatting logic for different file types.

## User Experience Focus

The frontend emphasizes a seamless user experience with:

- Clear visual hierarchy
- Consistent design patterns
- Responsive feedback for user actions
- Graceful error handling
- Accessibility considerations
- Performance optimization

This design approach ensures that support agents can focus on helping customers rather than navigating a complex interface.
