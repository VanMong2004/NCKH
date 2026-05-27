Uncaught TypeError: Cannot read properties of undefined (reading 'rating')
    at ProductReviews (ProductDetail.jsx:14:39)
    at renderWithHooks (chunk-PJEEZAML.js?v=2d876938:11548:26)
    at mountIndeterminateComponent (chunk-PJEEZAML.js?v=2d876938:14926:21)
    at beginWork (chunk-PJEEZAML.js?v=2d876938:15914:22)
    at HTMLUnknownElement.callCallback2 (chunk-PJEEZAML.js?v=2d876938:3674:22)
    at Object.invokeGuardedCallbackDev (chunk-PJEEZAML.js?v=2d876938:3699:24)
    at invokeGuardedCallback (chunk-PJEEZAML.js?v=2d876938:3733:39)
    at beginWork$1 (chunk-PJEEZAML.js?v=2d876938:19765:15)
    at performUnitOfWork (chunk-PJEEZAML.js?v=2d876938:19198:20)
    at workLoopSync (chunk-PJEEZAML.js?v=2d876938:19137:13)Understand this error
chunk-PJEEZAML.js?v=2d876938:14032 The above error occurred in the <ProductReviews> component:

    at ProductReviews (http://[::1]:5173/resources/js/pages/ProductDetail.jsx?t=1779633639617:8:42)
    at RenderedRoute (http://[::1]:5173/node_modules/.vite/deps/react-router-dom.js?v=2d876938:6284:26)
    at Routes (http://[::1]:5173/node_modules/.vite/deps/react-router-dom.js?v=2d876938:7133:3)
    at CartProvider (http://[::1]:5173/resources/js/contexts/CartContext.jsx:10:32)
    at AuthProvider (http://[::1]:5173/resources/js/contexts/AuthContext.jsx:7:32)
    at ThemeProvider (http://[::1]:5173/resources/js/contexts/ThemeContext.jsx:5:33)
    at Router (http://[::1]:5173/node_modules/.vite/deps/react-router-dom.js?v=2d876938:7074:13)
    at BrowserRouter (http://[::1]:5173/node_modules/.vite/deps/react-router-dom.js?v=2d876938:10191:3)

Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://reactjs.org/link/error-boundaries to learn more about error boundaries.