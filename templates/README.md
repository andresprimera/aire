# Templates Directory

This directory is reserved for storing DOCX template files that can be used by the business plan agent.

## Current Implementation

The business plan generation currently uses the `docx` library to programmatically create documents with:
- Custom logo images
- Brand colors (primary and secondary)
- Structured sections and content

## Future Enhancement

In the future, actual `.docx` template files can be placed here and loaded using `docxtemplater` and `pizzip` libraries to:
- Use pre-designed templates with placeholders
- Replace text, images, and styling dynamically
- Support multiple template options for different business plan types

## Usage

The default logo used is `/public/logo_aire.png`. Users can specify custom logo paths, primary colors, and secondary colors when generating business plans.
