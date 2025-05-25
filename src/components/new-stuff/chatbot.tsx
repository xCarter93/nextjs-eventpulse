import React from "react";
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Spinner } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";

export const ChatbotButton = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentStep, setCurrentStep] = React.useState(0);
  
  const introSteps = [
    {
      title: "Meet EventPulse Assistant",
      description: "I'm your AI-powered event management assistant. I can help you navigate EventPulse and make the most of its features.",
      icon: "lucide:bot"
    },
    {
      title: "Search Through Data",
      description: "Ask me to find contacts, events, or any information you need. I can quickly search through your data to find what you're looking for.",
      icon: "lucide:search"
    },
    {
      title: "Create Contacts & Events",
      description: "Need to add a new contact or set up an event? I can guide you through the process or even create them for you based on your instructions.",
      icon: "lucide:user-plus"
    },
    {
      title: "Email Template Assistance",
      description: "I can help you design email templates, suggest content, and optimize your communications for better engagement.",
      icon: "lucide:mail-plus"
    }
  ];

  React.useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setCurrentStep(0);
      
      // Simulate loading
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (!isLoading && currentStep < introSteps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, currentStep]);

  return (
    <>
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, duration: 0.3, type: "spring", stiffness: 260, damping: 20 }}
      >
        <Button 
          isIconOnly
          color="primary" 
          size="lg" 
          radius="full"
          className="shadow-lg"
          onPress={onOpen}
        >
          <Icon icon="lucide:message-circle" className="text-xl" />
        </Button>
      </motion.div>

      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange}
        size="lg"
        placement="bottom-end"
        classNames={{
          base: "m-0 sm:mx-4 sm:my-4 sm:mb-16 sm:mr-16"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 border-b border-divider">
                <div className="flex items-center">
                  <Icon icon="lucide:zap" className="text-primary mr-2" />
                  <span>EventPulse Assistant</span>
                </div>
              </ModalHeader>
              <ModalBody className="p-0">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Spinner color="primary" size="lg" />
                    <p className="mt-4 text-foreground-500">Initializing assistant...</p>
                  </div>
                ) : (
                  <div className="p-6">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center text-center"
                      >
                        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                          <Icon icon={introSteps[currentStep].icon} className="text-primary text-2xl" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{introSteps[currentStep].title}</h3>
                        <p className="text-foreground-600 max-w-md">{introSteps[currentStep].description}</p>
                        
                        <div className="flex gap-2 mt-6">
                          {introSteps.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentStep(index)}
                              className={`w-2 h-2 rounded-full transition-all ${
                                index === currentStep ? "bg-primary w-6" : "bg-primary-200"
                              }`}
                              aria-label={`Go to step ${index + 1}`}
                            />
                          ))}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                    
                    {currentStep === introSteps.length - 1 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, duration: 0.3 }}
                        className="mt-8"
                      >
                        <div className="border border-divider rounded-lg p-4 bg-content1">
                          <p className="text-sm text-foreground-600 mb-3">How can I help you today?</p>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="flat" color="primary">
                              Create a new event
                            </Button>
                            <Button size="sm" variant="flat" color="primary">
                              Add contacts
                            </Button>
                            <Button size="sm" variant="flat" color="primary">
                              Design an email
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter className="border-t border-divider">
                {!isLoading && (
                  <div className="w-full">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ask me anything about EventPulse..."
                        className="w-full px-4 py-2 pr-10 rounded-lg border border-divider focus:outline-none focus:border-primary"
                      />
                      <Button
                        isIconOnly
                        color="primary"
                        size="sm"
                        radius="full"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2"
                      >
                        <Icon icon="lucide:send" className="text-sm" />
                      </Button>
                    </div>
                  </div>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};