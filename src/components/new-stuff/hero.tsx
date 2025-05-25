import React from "react";
import { Button, Card, CardBody } from "@heroui/react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden pt-16 md:pt-20 lg:pt-28">
      <div className="absolute inset-0 bg-gradient-to-b from-primary-50/30 to-background pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 pb-16 md:pb-24">
          <motion.div 
            className="flex-1 text-center lg:text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              Simplify Event Management with <span className="text-primary">EventPulse</span>
            </h1>
            
            <p className="mt-6 text-lg md:text-xl text-foreground-600 max-w-2xl mx-auto lg:mx-0">
              Create custom events, manage contacts, send automated reminders, and design beautiful email templates with our intuitive drag-and-drop editor.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                color="primary" 
                size="lg" 
                className="font-medium px-8"
                startContent={<Icon icon="lucide:zap" />}
              >
                Get Started Free
              </Button>
              <Button 
                variant="bordered" 
                size="lg" 
                className="font-medium px-8"
                startContent={<Icon icon="lucide:play-circle" />}
              >
                Watch Demo
              </Button>
            </div>
            
            <div className="mt-8 flex items-center justify-center lg:justify-start gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((id) => (
                  <img 
                    key={id}
                    src={`https://img.heroui.chat/image/avatar?w=40&h=40&u=${id}`} 
                    alt="User avatar" 
                    className="w-8 h-8 rounded-full border-2 border-background"
                  />
                ))}
              </div>
              <p className="text-sm text-foreground-500">
                <span className="font-semibold text-foreground-700">1,000+</span> event planners trust EventPulse
              </p>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex-1"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card className="shadow-xl border border-divider overflow-hidden">
              <CardBody className="p-0">
                <img 
                  src="https://img.heroui.chat/image/dashboard?w=800&h=600&u=1" 
                  alt="EventPulse Dashboard" 
                  className="w-full h-auto object-cover"
                />
              </CardBody>
            </Card>
          </motion.div>
        </div>
        
        <div className="py-8 border-t border-divider">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-70">
            {["logos:microsoft", "logos:google", "logos:airbnb", "logos:spotify"].map((logo, index) => (
              <Icon key={index} icon={logo} className="h-8 md:h-10 w-auto" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};